"""Package the supplied site content and brand assets without rewriting the runtime."""
import base64
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/tmp/goar-source")
APP = ROOT / "artifacts/goar"
SLUGS = ("privacy", "terms", "license", "data-safety", "contact")

documents = []
for slug in SLUGS:
    page = (SOURCE / f"{slug}.html").read_text()
    title = re.search(r"<title>(.*?)</title>", page, re.S).group(1).split(" — ")[0]
    content = re.search(r"<main\b[^>]*>(.*?)</main>", page, re.S).group(1)
    content = re.sub(r'\sstyle="[^"]*"', "", content)
    documents.append({"slug": slug, "title": title, "html": content})

output = APP / "src/data/legal.json"
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps(documents, ensure_ascii=False, indent=2))

runtime = (APP / "public/workspace/index.html").read_text()
logo = re.search(r'<img class="goar-mark" src="data:image/png;base64,([^"]+)"', runtime)
if not logo:
    raise RuntimeError("Brand mark missing from supplied browser application")
(APP / "public/brand.png").write_bytes(base64.b64decode(logo.group(1)))
(APP / "public/favicon.png").write_bytes((SOURCE / "assets/favicon.png").read_bytes())
print(f"Prepared {len(documents)} original documents and Goar brand images.")