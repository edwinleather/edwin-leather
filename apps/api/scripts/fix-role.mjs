import { MongoClient } from "mongodb";
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";
(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const result = await db.collection("users").updateOne(
    { email: "1812adityaraj2@gmail.com" },
    { $set: { role: "superadmin" } }
  );
  console.log("Matched:", result.matchedCount, "Modified:", result.modifiedCount);
  const user = await db.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  console.log("Role now:", user.role);
  await client.close();
})();
