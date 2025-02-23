import { Resource } from "sst";
import { db, schema } from "./db";
import { eq, sql } from "drizzle-orm";

const emotions = ["ANGRY", "HAPPY", "SAD", "SURPRISE", "NEUTRAL"] as const;
type Emotion = (typeof emotions)[number];
const emotionToScore: Record<Emotion, number> = {
  SAD: 0.1,
  ANGRY: 0.1,
  HAPPY: 1,
  NEUTRAL: 0.5,
  SURPRISE: 0.5,
};

export const handler = async (e: AWSLambda.SQSEvent) => {
  const body = JSON.parse(e.Records[0].body);
  console.log(body);
  const { imageid, frameid } = body;

  const key = frameid ? `${imageid}/${frameid}.png` : imageid;
  console.log(key);

  const resp = await fetch(
    Resource.Model.url + "?" + new URLSearchParams({ key }),
  );

  const emotion = (await resp.text()) as Emotion;
  console.log(emotion);
  const score = emotionToScore[emotion] || 0;
  console.log(score);

  const res = await db
    .update(schema.images)
    .set({
      processed: sql`${schema.images.processed} + 1`,
      fraudScore: sql`${schema.images.fraudScore} + ${score}`,
    })
    .where(eq(schema.images.id, imageid))
    .returning();

  console.log(res);
};
