"""Phase 2: functional probes for www.edwinleather.com.

Invalid/edge-case payloads to every public write endpoint must answer with
a proper client error (400/401/403/404/409/422), never a crash (500) or hang.
Then exercises dynamic product/category routes from live data.
Creates NO records - all bodies are intentionally invalid.
"""
import json
import urllib.request
import urllib.error

BASE = "https://www.edwinleather.com"


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={
        "User-Agent": "Mozilla/5.0 (site-probe)",
        "Content-Type": "application/json",
        "Accept": "application/json,text/html",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return -1, str(e).encode()


def is_json_ok(raw):
    try:
        v = json.loads(raw.decode())
        return isinstance(v, dict) and "ok" in v
    except Exception:
        return False


results = {"ok": 0, "fail": 0, "fails": []}


def check(label, cond, detail=""):
    if cond:
        results["ok"] += 1
        print(f"OK   {label}", flush=True)
    else:
        results["fail"] += 1
        results["fails"].append(f"{label} :: {detail}")
        print(f"FAIL {label} :: {detail}", flush=True)


WRITES = [
    ("POST", "/api/v1/auth/login", {}, {400, 401, 422}),
    ("POST", "/api/v1/auth/signup", {"email": "x"}, {400, 422}),
    ("POST", "/api/v1/auth/google", {"idToken": "invalid-token"}, {400, 401}),
    ("POST", "/api/v1/auth/verify-email", {"token": "nope"}, {400, 404}),
    ("POST", "/api/v1/auth/resend-verification", {"email": "bad"}, {200, 400, 404, 422}),
    ("POST", "/api/v1/auth/forgot-password", {"email": "bad"}, {200, 400, 404, 422}),
    ("POST", "/api/v1/auth/reset-password", {"token": "nope", "password": "x"}, {400, 404, 422}),
    ("POST", "/api/v1/auth/logout", {}, {200, 204, 400, 401}),
    ("POST", "/api/v1/orders", {}, {400, 401, 403, 422}),
    ("POST", "/api/v1/orders/validate-coupon", {"code": "NOPE"}, {200, 400, 404, 422}),
    ("POST", "/api/v1/payments/create-order", {}, {400, 401, 403, 422}),
    ("POST", "/api/v1/payments/verify", {"nope": 1}, {400, 401}),
]
WRITES2 = [
    ("POST", "/api/v1/cart/stock-check", [{"lineId": "probe", "productId": "000000000000000000000000", "variantId": "000000000000000000000000", "quantity": 1}], {200, 400, 422}),
    ("POST", "/api/v1/cart/stock-check", "not-an-array", {200, 400, 422}),
    ("GET", "/api/v1/cart", None, {200, 401}),
    ("PUT", "/api/v1/cart", {"items": "nope"}, {200, 400, 401, 422}),
    ("POST", "/api/v1/feedback", {"message": ""}, {400, 422}),
    ("POST", "/api/v1/reviews", {"rating": 99}, {400, 401, 422}),
    ("POST", "/api/v1/returns", {}, {400, 401, 403, 422}),
    ("GET", "/api/v1/returns/order/DOESNOTEXIST", None, {400, 401, 404}),
    ("POST", "/api/v1/products/analytics/event", {"type": "bogus"}, {204, 400, 422}),
    ("GET", "/api/v1/account/orders", None, {200, 401}),
    ("GET", "/api/v1/admin/products", None, {401, 403}),
    ("POST", "/api/v1/admin/products", {"name": "x"}, {400, 401, 403}),
    ("GET", "/api/v1/admin/inventory", None, {401, 403}),
    ("GET", "/api/v1/admin/orders", None, {401, 403}),
    ("GET", "/api/v1/admin/categories", None, {401, 403}),
    ("GET", "/api/v1/admin/attributes", None, {401, 403}),
    ("GET", "/api/v1/backoffice/stats", None, {401, 403}),
    ("GET", "/api/v1/backoffice/settings", None, {401, 403}),
    ("GET", "/api/v1/backoffice/export/database", None, {401, 403}),
]

print("====== WRITE-PATH PROBES ======", flush=True)
for method, path, body, want in WRITES + WRITES2:
    status, raw = call(method, path, body)
    ok_status = status in want
    ok_crash = status not in (500, 502, -1)
    shape_ok = True
    if status in (400, 401, 403, 404, 409, 422):
        shape_ok = is_json_ok(raw) or len(raw) < 2000
    check(f"{method} {path} -> {status}", ok_status and ok_crash and shape_ok,
          f"want={sorted(want)} got={status} body={raw[:140]!r}")

print("\n====== DYNAMIC PAGES FROM LIVE DATA ======", flush=True)
_, prod_raw = call("GET", "/api/v1/products?limit=8")
_, cat_raw = call("GET", "/api/v1/categories")
try:
    products = json.loads(prod_raw.decode())["data"]
except Exception:
    products = []
try:
    cats = json.loads(cat_raw.decode())["data"]
except Exception:
    cats = []

for p in products[:8]:
    slug = p.get("slug")
    if not slug:
        check("product slug present", False, str(p)[:120])
        continue
    status, raw = call("GET", f"/product/{slug}")
    html = raw.decode("utf-8", "ignore").lower()
    check(f"GET /product/{slug} -> {status}", status == 200 and (p["name"].split()[0].lower() in html),
          f"status={status}")
    status2, raw2 = call("GET", f"/api/v1/products/{slug}")
    try:
        pv = json.loads(raw2.decode())
        okpv = status2 == 200 and pv.get("ok") and pv["data"].get("slug") == slug
        has_media = isinstance(pv["data"].get("media"), list)
        has_variants = isinstance(pv["data"].get("productVariants"), list)
    except Exception:
        okpv = has_media = has_variants = False
    check(f"GET /api/v1/products/{slug}", okpv and has_media and has_variants,
          f"status={status2} media={has_media} variants={has_variants}")

for c in cats[:8]:
    slug = c.get("slug") or c.get("name", "").lower().replace(" ", "-")
    status, raw = call("GET", f"/category/{slug}")
    check(f"GET /category/{slug} -> {status}", status == 200, f"status={status}")

status, _ = call("GET", "/product/this-slug-does-not-exist-xyz")
check("GET /product/<missing> -> 404", status == 404, f"status={status}")
status, _ = call("GET", "/api/v1/products/this-slug-does-not-exist-xyz")
check("GET /api/v1/products/<missing> -> 404", status == 404, f"status={status}")

print(f"\n====== TOTAL ok={results['ok']} fail={results['fail']} ======")
if results["fails"]:
    print("FAILS:")
    for f in results["fails"]:
        print("  -", f)
