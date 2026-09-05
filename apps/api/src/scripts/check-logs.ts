import "dotenv/config";
import mongoose from "mongoose";

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const logs = await mongoose.connection.db!.collection("emaillogs").find({}).sort({ createdAt: -1 }).limit(10).toArray();
  console.log("\nRecent email logs:");
  logs.forEach((l) => {
    console.log(`  ${l.status} | ${l.template} | ${l.to} | ${l.createdAt?.toISOString()}`);
  });
  console.log(`\nTotal logs: ${logs.length}`);
  await mongoose.disconnect();
}

main();
