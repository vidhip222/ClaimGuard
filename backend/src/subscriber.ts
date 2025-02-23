import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import path from "path";
import { tmpdir } from "os";
import { downloadFileToDisk, sendMessage, uploadFileFromDisk } from "./lib/aws";
import { extractFrames } from "./lib/ffmpeg";
import { readdir } from "fs/promises";
import { mkdir } from "fs/promises";

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
  } else if (img.type === "audio") {
    // transcribe then llm
  } else if (img.type === "image") {
    // send to python worker
    await sendMessage(JSON.stringify({ imageid: key }));
  } else if (img.type === "video") {
    // send to python worker
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
