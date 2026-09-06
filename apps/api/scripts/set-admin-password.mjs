import { randomBytes, scryptSync } from "crypto";
import { MongoClient, ObjectId } from "mongodb";

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
const backofficeDb = client.db("edwin-backoffice");

const existing = await db.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
let userId;
if (existing) {
  await db.collection("users").updateOne(
    { _id: existing._id },
    { $set: { passwordHash, provider: "local", emailVerifiedAt: new Date(), role: "superadmin" } }
  );
  userId = existing._id;
} else {
  userId = new ObjectId();
  await db.collection("users").insertOne({
    _id: userId, email: "1812adityaraj2@gmail.com", name: "Edwin Admin",
    role: "superadmin", passwordHash, provider: "local",
    emailVerifiedAt: new Date(), isActive: true, addresses: [],
    createdAt: new Date(), updatedAt: new Date()
  });
}
console.log("Main user ID:", userId);

const boExisting = await backofficeDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
if (!boExisting) {
  await backofficeDb.collection("users").insertOne({
    email: "1812adityaraj2@gmail.com", name: "Edwin Admin",
    role: "superadmin", active: true, appUserId: userId,
    createdAt: new Date(), updatedAt: new Date()
  });
  console.log("Backoffice admin created");
}

console.log("Login with: email=1812adityaraj2@gmail.com password=EdwinAdmin2026!");
await client.close();
