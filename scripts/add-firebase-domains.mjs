import { readFileSync } from "fs";
import { createSign } from "crypto";
import { request as httpsRequest } from "https";

const envFile = readFileSync("D:/edwin-leathers/apps/api/.env", "utf8");
const getVal = (key) => {
  const match = envFile.match(new RegExp(key + "=(.+)"));
  return match ? match[1] : "";
};

const projectId = "edwinleather-4f456";
const clientEmail = getVal("FIREBASE_CLIENT_EMAIL");
let privateKeyRaw = getVal("FIREBASE_PRIVATE_KEY");
privateKeyRaw = privateKeyRaw.replace(/^"|"$/g, "").replace(/\\n/g, "\n");

const now = Math.floor(Date.now() / 1000);
const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
const payload = Buffer.from(
  JSON.stringify({ iss: clientEmail, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
).toString("base64url");
const sign = createSign("RSA-SHA256");
sign.update(header + "." + payload);
const signature = sign.sign(privateKeyRaw, "base64url");
const jwt = `${header}.${payload}.${signature}`;

function getToken() {
  return new Promise((resolve) => {
    const req = httpsRequest("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(JSON.parse(data).access_token));
    });
    req.write(`grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`);
    req.end();
  });
}

function apiCall(token, url) {
  return new Promise((resolve) => {
    const req = httpsRequest(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d));
    });
    req.end();
  });
}

const token = await getToken();
const resp = await apiCall(token, `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`);
const config = JSON.parse(resp);
console.log("Authorized domains:", JSON.stringify(config.authorizedDomains, null, 2));
