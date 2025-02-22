import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { logger } from "hono/logger";

const app = new Hono()
  .use(logger())
  .get("/", (c) => c.text("Hello World"))
  .put("/claim", async (c) => {
    const id = crypto.randomUUID();
    await db.insert(schema.claims).values({
      id,
    });

    return c.json({ id });
  })
  .post("/claim/:id", async (c) => {
    const id = c.req.param().id;
    const claim = await db.query.claims.findFirst({
      where: eq(schema.claims.id, id),
      with: {
        images: true,
      },
    });

    if (!claim) return c.json({ error: "Claim not found" }, 404);
    const imageid = crypto.randomUUID();
    const s3 = new S3Client({});
    const [_, url] = await Promise.all([
      db.insert(schema.images).values({
        id: imageid,
        claimId: claim.id,
      }),
      getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: Resource.Bucket.name,
          Key: id,
        }),
      ),
    ]);

    return c.json({ url, imageid });
  });

export const handler = handle(app);
export type AppType = typeof app;
