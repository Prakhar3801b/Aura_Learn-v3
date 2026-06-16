import logging
import socket
import urllib.request
import json
import ssl
import httpx
from typing import List
from config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# DNS-over-HTTPS monkey patch for socket.getaddrinfo to resolve Render cloud DNS issues
_original_getaddrinfo = socket.getaddrinfo

def custom_getaddrinfo(host, port, family=0, type=0, proto=0, flags=0):
    try:
        # Force IPv4 connection to avoid black-holed IPv6 addresses
        target_family = socket.AF_INET if family == 0 else family
        return _original_getaddrinfo(host, port, target_family, type, proto, flags)
    except socket.gaierror as e:
        if host in ("router.huggingface.co", "api-inference.huggingface.co", "api.groq.com", "xfeqthkfprcttmlmhvsl.supabase.co"):
            logger.warning(f"System DNS failed to resolve {host}: {e}. Retrying with DNS-over-HTTPS fallback...")
            
            resolved_ip = None
            
            # 1. Try Cloudflare DoH (Direct IP call to 1.1.1.1)
            try:
                url = f"https://1.1.1.1/dns-query?name={host}&type=A"
                req = urllib.request.Request(
                    url, 
                    headers={"accept": "application/dns-json", "User-Agent": "Mozilla/5.0"}
                )
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                with urllib.request.urlopen(req, context=ctx, timeout=4.0) as response:
                    data = json.loads(response.read().decode())
                    for ans in data.get("Answer", []):
                        if ans.get("type") == 1:
                            resolved_ip = ans.get("data")
                            break
            except Exception as doh_err:
                logger.warning(f"Cloudflare DoH failed for {host}: {doh_err}")
                
            # 2. Try Google DoH (Direct IP call to 8.8.8.8)
            if not resolved_ip:
                try:
                    url = f"https://8.8.8.8/resolve?name={host}&type=A"
                    req = urllib.request.Request(
                        url, 
                        headers={"accept": "application/dns-json", "User-Agent": "Mozilla/5.0"}
                    )
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    with urllib.request.urlopen(req, context=ctx, timeout=4.0) as response:
                        data = json.loads(response.read().decode())
                        for ans in data.get("Answer", []):
                            if ans.get("type") == 1:
                                resolved_ip = ans.get("data")
                                break
                except Exception as doh_err:
                    logger.warning(f"Google DoH failed for {host}: {doh_err}")
            
            if resolved_ip:
                logger.info(f"DoH successfully resolved {host} to {resolved_ip}")
                int_port = port
                if isinstance(port, str):
                    if port == "https":
                        int_port = 443
                    elif port == "http":
                        int_port = 80
                    else:
                        try:
                            int_port = int(port)
                        except ValueError:
                            try:
                                int_port = socket.getservbyname(port)
                            except:
                                int_port = 443
                return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (resolved_ip, int_port))]
        raise

socket.getaddrinfo = custom_getaddrinfo


class EmbeddingService:
    """Service to generate vector embeddings using Hugging Face Serverless Inference API."""

    def __init__(self):
        self.model_id = "BAAI/bge-small-en-v1.5"
        self.endpoints = [
            f"https://router.huggingface.co/hf-inference/models/{self.model_id}",
            f"https://api-inference.huggingface.co/models/{self.model_id}"
        ]
        self.headers = {}
        if settings.hf_api_key:
            self.headers["Authorization"] = f"Bearer {settings.hf_api_key}"
        logger.info(f"Hugging Face Embedding Service initialized with model: {self.model_id}")

    def embed_texts(self, texts: List[str], input_type: str = "document") -> List[List[float]]:
        """
        Generate embeddings for a list of texts, with fallback endpoints and retries.
        """
        if not texts:
            return []

        import time
        max_retries = 2
        base_delay = 1.0

        for url in self.endpoints:
            logger.info(f"Attempting to generate embeddings using: {url}")
            for attempt in range(max_retries):
                try:
                    response = httpx.post(
                        url,
                        headers=self.headers,
                        json={"inputs": texts, "options": {"wait_for_model": True}},
                        timeout=25.0
                    )
                    response.raise_for_status()
                    result = response.json()
                    
                    # The API returns a list of floats (for a single string input) or list of lists.
                    if isinstance(result, list):
                        if len(result) > 0 and not isinstance(result[0], list):
                            return [result]
                        return result
                    else:
                        raise ValueError(f"Unexpected response format from HF API: {result}")
                except (httpx.ConnectError, httpx.ConnectTimeout, httpx.HTTPStatusError) as e:
                    logger.warning(f"Embedding attempt {attempt + 1} failed on {url}: {e}")
                    if attempt == max_retries - 1:
                        logger.error(f"Failed to resolve or connect to {url} after {max_retries} attempts.")
                        break # Try next endpoint in list
                    time.sleep(base_delay * (attempt + 1))
        
        raise RuntimeError("All Hugging Face embedding endpoints failed.")

    def embed_query(self, query: str) -> List[float]:
        """Convenience method for embedding a single query."""
        prefixed_query = f"Represent this sentence for searching relevant passages: {query}"
        embeddings = self.embed_texts([prefixed_query], input_type="query")
        return embeddings[0] if embeddings else []

