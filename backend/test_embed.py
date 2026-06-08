import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
from services.embedding_service import EmbeddingService

try:
    svc = EmbeddingService()
    res = svc.embed_query("Hello world")
    print(f"Dimension: {len(res)}")
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {e}")
