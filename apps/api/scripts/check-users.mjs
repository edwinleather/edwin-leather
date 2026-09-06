import { MongoClient } from "mongodb";
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const mainDb = client.db("edwin-leathers");
  const boDb = client.db("edwin-backoffice");

  // Find ALL users with this email
  const users = await mainDb.collection("users").find({ email: "1812adityaraj2@gmail.com" }).toArray();
  console.log("Main DB users with this email:", users.length);
  for (const u of users) {
    console.log("  _id:", u._id.toString(), "role:", u.role, "provider:", u.provider);
  }

  // Find ALL admin users with this email
  const admins = await boDb.collection("users").find({ email: "1812adityaraj2@gmail.com" }).toArray();
  console.log("Backoffice admins with this email:", admins.length);
  for (const a of admins) {
    console.log("  _id:", a._id.toString(), "appUserId:", a.appUserId?.toString(), "role:", a.role, "active:", a.active);
  }

  await client.close();
})();
