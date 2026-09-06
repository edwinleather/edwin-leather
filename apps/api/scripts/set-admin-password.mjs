import { randomBytes, scryptSync } from "crypto";
import { MongoClient } from "mongodb";

const password = "EdwinAdmin2026!";
const KEYLEN = 64;
const N = 16384, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEYLEN, { N, r, p });
const passwordHash = "scrypt:" + N + ":" + r + ":" + p + ":" + salt.toString("base64") + ":" + hash.toString("base64");

const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(MONGODB_URI);
await client.connect();
const db = client.db();

await db.collection("users").updateOne(
  { email: "1812adityaraj2@gmail.com" },
  { $set: { passwordHash, provider: "local", emailVerifiedAt: new Date(), role: "superadmin" } }
);
console.log("Password set for 1812adityaraj2@gmail.com");
console.log("Login with: email=1812adityaraj2@gmail.com password=EdwinAdmin2026!");

await client.close();
