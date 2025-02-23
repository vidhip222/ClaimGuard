import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Resource } from "sst";
import * as fs from "fs";
import * as stream from "stream";
import { promisify } from "util";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const s3 = new S3Client();
const sqs = new SQSClient({});

export async function uploadFile(key: string, file: Buffer | string) {
  return s3.send(
    new PutObjectCommand({
      Bucket: Resource.Bucket.name,
      Key: key,
      Body: file,
    }),
  );
}

export async function uploadFileFromDisk(key: string, path: string) {
  const fileStream = fs.createReadStream(path);

  return s3.send(
    new PutObjectCommand({
      Bucket: Resource.Bucket.name,
      Key: key,
      Body: fileStream,
    }),
  );
}

export async function downloadFileToDisk(key: string, filePath: string) {
  const pipeline = promisify(stream.pipeline);
  const command = new GetObjectCommand({
    Bucket: Resource.Bucket.name,
    Key: key,
  });

  const { Body } = await s3.send(command);

  if (!Body) {
    throw new Error("No data received from S3");
  }

  await pipeline(Body as NodeJS.ReadableStream, fs.createWriteStream(filePath));
}

export async function sendMessage(message: string) {
  console.log(message);
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: Resource.Queue.url,
      MessageBody: message,
    }),
  );
}
