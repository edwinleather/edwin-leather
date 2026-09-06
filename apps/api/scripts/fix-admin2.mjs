import { MongoClient, ObjectId } from "mongodb";
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const mainDb = client.db("edwin-leathers");
  const boDb = client.db("edwin-backoffice");

  const user = await mainDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  if (!user) { console.log("User not found"); await client.close(); return; }
  console.log("Main DB user._id:", user._id.toString());

  // Upsert admin with the correct appUserId
  const result = await boDb.collection("users").updateOne(
    { email: "1812adityaraj2@gmail.com" },
    {
      $set: {
        appUserId: user._id,
        role: "superadmin",
        active: true,
      },
      $setOnInsert: {
        email: "1812adityaraj2@gmail.com",
        firstName: user.firstName || "Aditya",
        lastName: user.lastName || "Raj",
        provider: user.provider || "google",
        googleId: user.googleId,
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log("Upserted:", result.upsertedId || result.modifiedCount);

  // Verify the lookup that the middleware does
  const admin = await boDb.collection("users").findOne({ appUserId: user._id });
  console.log("Admin lookup by ObjectId:", admin ? "FOUND" : "NOT FOUND");
  if (admin) console.log("  role:", admin.role, "active:", admin.active);

  // Also try string lookup (how Mongoose might query)
  const adminStr = await boDb.collection("users").findOne({ appUserId: user._id.toString() });
  console.log("Admin lookup by string:", adminStr ? "FOUND" : "NOT FOUND");

  await client.close();
})();
