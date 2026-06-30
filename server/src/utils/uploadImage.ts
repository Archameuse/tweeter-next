import { v4 } from "uuid";
import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import path from "node:path";

/**replace with actual logic for uploading to some api */
export default async function uploadImage(image: File): Promise<string> {
  // return "/tempUploads/04b211f9-3922-4979-8a67-fdcbe6efda43.webp";
  const buffer = Buffer.from(await image.arrayBuffer());
  const webpBuffer = await sharp(buffer).webp().toBuffer();
  const filename = `${v4()}.webp`;
  const uploadDir = "../client/public/tempUploads";
  //   return path.join(uploadDir, filename);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), webpBuffer);
  return `/tempUploads/${filename}`;
}
