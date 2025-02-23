import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";
import path from "path";
import { tmpdir } from "os";
import { downloadFileToDisk, sendMessage, uploadFileFromDisk } from "./lib/aws";
import { extractFrames, ffmpeg } from "./lib/ffmpeg";
import { readdir } from "fs/promises";
import { mkdir } from "fs/promises";
import { analyzeImage, analyzePDF } from "./ai";

export const handler = async (event: AWSLambda.S3CreateEvent) => {
  const { key } = event.Records[0].s3.object;
  const img = await db.query.images.findFirst({
    where: eq(schema.images.id, key),
    with: {
      claims: true,
    },
  });
  if (!img) return;

  if (img.type === "text") {
    // this is a PDF
    // fraud detection (LLM)
    const tmp = tmpdir();
    await mkdir(tmp, { recursive: true });
    await downloadFileToDisk(key, `${tmp}/text.pdf`);
    const score = 10 - (await analyzePDF(`${tmp}/text.pdf`));

    await db
      .update(schema.images)
      .set({
        processed: sql`${schema.images.processed} + 1`,
        fraudScore: sql`${schema.images.fraudScore} + ${score / 10}`,
      })
      .returning();
  } else if (img.type === "audio") {
    // transcribe then llm
    console.log("audio todo!");
  } else if (img.type === "image") {
    const tmp = tmpdir();
    await mkdir(tmp, { recursive: true });
    await downloadFileToDisk(key, `${tmp}/img`);
    await ffmpeg([
      "-y",
      "-i",
      `${tmp}/img`,
      "-vf",
      "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2",
      `${tmp}/img.png`,
    ]);

    const cost = (await analyzeImage(`${tmp}/img.png`)) || 0;

    await db
      .update(schema.images)
      .set({
        processed: sql`${schema.images.processed} + 1`,
        cost,
      })
      .returning();
  } else if (img.type === "video") {
    // send to rust worker
    const tmp = path.join(tmpdir(), key);
    await mkdir(tmp, { recursive: true });
    const video = `${tmp}/video.mp4`;
    await downloadFileToDisk(key, video);
    await extractFrames(video);
    const files = await readdir(tmp);
    console.log(files);

    const frames = files
      .filter((f) => path.extname(f) === ".png")
      .map((f) => path.join(tmp, f));

    console.log(frames);

    await Promise.all([
      ...frames.map(async (f, i) => {
        await uploadFileFromDisk(`${key}/${i}.png`, f);
        await sendMessage(
          JSON.stringify({
            imageid: key,
            frameid: i,
          }),
        );
      }),
      db
        .update(schema.images)
        .set({
          count: frames.length,
        })
        .where(eq(schema.images.id, key)),
    ]);
  }

  return;
};
