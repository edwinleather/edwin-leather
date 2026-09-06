import { MongoClient, ObjectId } from "mongodb";

// The correct URI (same as main, but we'll connect to edwin-backoffice explicitly)
const MONGODB_URI = "mongodb+srv://supportedwinleather_db_user:rYY6rAJt1JsbKhti@cluster0.puv29j6.mongodb.net/edwin-leathers?retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const mainDb = client.db("edwin-leathers");
  const boDb = client.db("edwin-backoffice");

  // Check what's in edwin-backoffice
  const boCollections = await boDb.listCollections().toArray();
  console.log("Collections in edwin-backoffice:", boCollections.map(c => c.name));

  // Check main DB users
  const user = await mainDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  console.log("Main DB user._id:", user?._id?.toString());

  // Create admin in edwin-backoffice
  if (user) {
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
        $setOnInsert: { createdAt: new Date() }
      },
      { upsert: true }
    );
    console.log("Admin upserted:", result.upsertedId || result.modifiedCount);
  }

  // Verify
  const admin = await boDb.collection("users").findOne({ email: "1812adityaraj2@gmail.com" });
  console.log("Admin in edwin-backoffice:", JSON.stringify({ email: admin?.email, role: admin?.role, appUserId: admin?.appUserId?.toString() }));

  await client.close();
})();
