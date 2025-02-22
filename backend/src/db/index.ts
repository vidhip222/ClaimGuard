import { drizzle } from "drizzle-orm/libsql";
import { Resource } from "sst";
import * as schema from "./schema";

const db = drizzle({
  connection: {
    url: Resource.db.url,
    authToken: Resource.db.token,
  },
  schema,
});

export { schema, db };
