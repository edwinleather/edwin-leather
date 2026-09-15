"""Full-site test harness for www.edwinleather.com.

Phase 1: static pages + public API GETs. Prints compact OK/FAIL lines.
Writes nothing to the database.
"""
import json
import urllib.request
import urllib.error

BASE = "https://www.edwinleather.com"

STATIC_PAGES = [
    "/", "/shop", "/cart", "/checkout", "/login", "/signup",
    "/account", "/contact", "/feedback", "/about", "/story",
    "/discount", "/privacy", "/terms", "/returns-policy",
    "/shipping-policy", "/thank-you", "/verify-email",
    "/reset-password", "/backoffice", "/robots.txt", "/sitemap.xml",
]

API_GETS = [
    "/api/v1/health",
    "/api/v1/products?limit=3",
    "/api/v1/categories",
    "/api/v1/reviews?limit=2",
    "/api/v1/payments/status",
    "/api/v1/payments/mode",
    "/api/v1/shipping/config",
    "/api/v1/site/content",
    "/api/v1/auth/me",
    "/api/v1/cart",
    "/api/v1/orders",
    "/api/v1/backoffice/overview",
]


def probe(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers={
        "User-Agent": "Mozilla/5.0 (site-probe)",
        "Content-Type": "application/json",
        "Accept": "text/html,application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body_bytes = r.read()
            return r.status, body_bytes, dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:400], dict(e.headers)
    except Exception as e:
        return -1, str(e).encode()[:400], {}


results = {"ok": 0, "fail": 0, "fails": []}

def check(label, cond, detail=""):
    if cond:
        results["ok"] += 1
        print(f"OK   {label}")
    else:
        results["fail"] += 1
        results["fails"].append(f"{label} :: {detail}")
        print(f"FAIL {label} :: {detail}")


print("====== STATIC PAGES ======")
for page in STATIC_PAGES:
    status, body, headers = probe("GET", page)
    if status == 200:
        html = body.decode("utf-8", "ignore").lower()
        looks_ok = "next" in html or "<html" in html or "edwin" in html or "sitemap" in html or page.endswith(".txt") or page.endswith(".xml")
        ctype = str(headers.get("Content-Type", ""))
        check(f"GET {page}", looks_ok, f"status={status} ctype={ctype} len={len(body)}")
    elif status in (301, 302, 307, 308):
        check(f"GET {page}", True, f"redirect status={status}")
    else:
        check(f"GET {page}", False, f"status={status} body={body[:120]!r}")

print("\n====== PUBLIC API ======")
for path in API_GETS:
    status, body, _ = probe("GET", path)
    try:
        parsed = json.loads(body.decode())
        is_json = isinstance(parsed, dict)
    except Exception:
        is_json, parsed = False, None
    check(f"GET {path}", status in (200, 401, 403, 404) and (is_json or status == 404),
          f"status={status} body={body[:120]!r}")

print(f"\n====== TOTAL ok={results['ok']} fail={results['fail']} ======")
if results["fails"]:
    print("FAILS:")
    for f in results["fails"]:
        print("  -", f)
