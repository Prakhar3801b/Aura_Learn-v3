import asyncio
import re
from bs4 import BeautifulSoup

def clean_text(html):
    soup = BeautifulSoup(html, "html.parser")
    # 1. Remove noisy elements
    for element in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        element.decompose()
    
    # 2. Extract text from main content areas if they exist, otherwise fallback to body
    main_content = soup.find("main") or soup.find("article") or soup.find("div", {"id": "content"}) or soup.find("body")
    
    if main_content:
        text = main_content.get_text(separator="\n", strip=True)
    else:
        text = soup.get_text(separator="\n", strip=True)
        
    # 3. Final cleanup: remove excessive newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text

# Mock HTML with noise
mock_html = """
<html>
<head><title>Test Article</title></head>
<body>
    <header>
        <nav><ul><li><a href="#">Home</a></li><li><a href="#">About</a></li></ul></nav>
    </header>
    <main>
        <h1>Main Topic: Photosynthesis</h1>
        <p>Photosynthesis is a process used by plants and other organisms to convert light energy into chemical energy.</p>
        <article>
            <h2>The Calvin Cycle</h2>
            <p>The Calvin cycle is a set of chemical reactions that take place in chloroplasts during photosynthesis.</p>
        </article>
    </main>
    <aside>
        <h3>Related Links</h3>
        <ul><li><a href="https://youtube.com/watch?v=123">Watch on YouTube</a></li></ul>
    </aside>
    <footer>
        <p>Copyright 2026. Follow us on <a href="https://youtube.com/aura">YouTube</a>.</p>
    </footer>
</body>
</html>
"""

cleaned = clean_text(mock_html)
print("--- Cleaned Text ---")
print(cleaned)
print("--------------------")

# Check if YouTube is present (it shouldn't be as it was in aside and footer)
if "YouTube" in cleaned:
    print("FAILED: YouTube noise still present in cleaned text!")
else:
    print("SUCCESS: YouTube noise removed correctly.")

# Check if main content is present
if "Photosynthesis" in cleaned and "Calvin Cycle" in cleaned:
    print("SUCCESS: Main content preserved.")
else:
    print("FAILED: Main content missing!")
