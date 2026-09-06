import { MongoClient, ObjectId } from "mongodb";
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  // Find the user ID from the main database
  const mainDb = client.db("edwin-leathers");
  const user = await mainDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  if (!user) { console.log("User not found in main DB"); await client.close(); return; }
  console.log("Found user:", user._id.toString(), "role:", user.role);

  // Create/update admin user in the backoffice database
  const boDb = client.db("edwin-backoffice");
  const result = await boDb.collection("users").updateOne(
    { email: "1812adityaraj2@gmail.com" },
    {
      $set: {
        email: "1812adityaraj2@gmail.com",
        firstName: user.firstName || "Aditya",
        lastName: user.lastName || "Raj",
        role: "superadmin",
        active: true,
        appUserId: user._id,
        provider: user.provider || "google",
        googleId: user.googleId,
      },
      $setOnInsert: {
        createdAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log("Backoffice admin upserted:", result.upsertedId || result.modifiedCount);

  // Verify
  const admin = await boDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  console.log("Admin in backoffice:", JSON.stringify({ email: admin.email, role: admin.role, active: admin.active }, null, 2));

  await client.close();
})();
