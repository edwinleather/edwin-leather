import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

await connectDatabase();

app.listen(env.port, () => {
  console.info(`[api] Edwin Leathers API listening on http://localhost:${env.port}`);
});
