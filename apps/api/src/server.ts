import { app } from "./app.js";
import { connectDatabase, databaseReady } from "./config/db.js";
import { seedDatabase } from "./config/seed.js";
import { env } from "./config/env.js";

await connectDatabase();
if (databaseReady()) await seedDatabase();

app.listen(env.port, () => {
  console.info(`[api] Edwin Leathers API listening on http://localhost:${env.port}`);
});
