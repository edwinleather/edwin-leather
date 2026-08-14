import { app } from "../src/app.js";
import { connectDatabase, databaseReady } from "../src/config/db.js";
import { seedDatabase } from "../src/config/seed.js";

void connectDatabase().then(() => {
  if (databaseReady()) return seedDatabase();
});

export default app;
