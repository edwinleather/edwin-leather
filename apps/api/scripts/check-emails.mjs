import { MongoClient } from "mongodb";
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";
(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("edwin-leathers");
  const logs = await db.collection("emaillogs").find({}).sort({ createdAt: -1 }).limit(5).toArray();
  console.log("Email logs:", JSON.stringify(logs.map(l => ({ to: l.to, template: l.template, status: l.status, error: l.errorMessage, subject: l.subject })), null, 2));
  await client.close();
})();
