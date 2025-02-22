import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Resource } from "sst";

const app = new Hono();

app.get("/", (c) => c.text("Hello World"));

app.get("/upload/:amount", async (c) => {
  const amount = parseInt(c.req.param().amount);

  const s3 = new S3Client({});
  const urls = await Promise.all(
    Array.from({ length: amount }, (_, i) => i).map(async (i) => {
      const id = crypto.randomUUID();

      const url = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: Resource.Bucket.name,
          Key: id,
        }),
      );

      return { id, url };
    }),
  );

  console.log(urls);

  return c.json(urls);
});

export const handler = handle(app);

