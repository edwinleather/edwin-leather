import { MongoClient } from "mongodb";
const client = new MongoClient("mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0");
await client.connect();
const db = client.db("edwin-backoffice");
await db.collection("users").updateOne({ email: "1812adityaraj2@gmail.com" }, { $set: { active: true } });
const admin = await db.collection("users").findOne({});
console.log("active:", admin.active);
await client.close();
