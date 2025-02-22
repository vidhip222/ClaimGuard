import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  schema: "./src/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url: Resource.db.url,
    authToken: Resource.db.token,
  },
  verbose: true,
  strict: true,
});
