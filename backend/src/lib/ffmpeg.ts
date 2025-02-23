import ffmpegPath from "ffmpeg-static";
import { spawn } from "child_process";
import path from "path";

export async function ffmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    console.log(ffmpegPath);
    const process = spawn(ffmpegPath!, args);

    process.stderr.on("data", (d) => console.error(d.toString()));
    process.stdout.on("data", (d) => console.log(d.toString()));

    process.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`ffmpeg exited with code ${code}`));
      }
      resolve();
    });
  });
}

export async function extractFrames(videoPath: string) {
  const dir = path.dirname(videoPath);
  const args = ["-i", videoPath, "-vf", "fps=1", `${dir}/frame_%03d.png`];

  try {
    await ffmpeg(args);
    console.log("Frames extracted successfully");
  } catch (error) {
    console.error("Error extracting frames:", error);
  }
}
