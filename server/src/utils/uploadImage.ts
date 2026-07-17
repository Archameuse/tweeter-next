import sharp from "sharp";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "node:path";
import drive from "#/db/drive.js";
import { Readable } from "node:stream";

export enum UPLOAD_IMAGE_SCOPE {
  tweet,
  avatar,
  banner,
}
export default async function uploadImage(
  image: File,
  scope: UPLOAD_IMAGE_SCOPE,
): Promise<{ route: string; onError: () => Promise<void> }> {
  // const timeStart = performance.now();
  const buffer = Buffer.from(await image.arrayBuffer());
  const webpBuffer = await sharp(buffer, { animated: true })
    .webp({
      quality: 78,
      effort: 6,
      lossless: false,
      smartSubsample: true,
    })
    .toBuffer();
  const filename = `${crypto.randomUUID()}.webp`;
  let folderId: string | undefined;
  switch (scope) {
    case UPLOAD_IMAGE_SCOPE.avatar:
      folderId = process.env.GOOGLE_AVATARS_FOLDER;
      break;
    case UPLOAD_IMAGE_SCOPE.banner:
      folderId = process.env.GOOGLE_BANNERS_FOLDER;
      break;
    case UPLOAD_IMAGE_SCOPE.tweet:
      folderId = process.env.GOOGLE_TWEETS_FOLDER;
      break;
  }
  if (!folderId)
    throw new Error(
      "Can't get id for a folder make sure GOOGLE_?_FOLDERS are provided for TWEETS, AVATARS and BANNERS",
    );
  const {
    data: { id },
  } = await drive.files.create({
    requestBody: {
      name: filename,
      parents: [folderId],
    },
    media: {
      body: Readable.from(webpBuffer),
      mimeType: "image/webp",
    },
    fields: "id",
  });
  if (!id)
    throw new Error(
      "Upload to google drive is failed since no id was returned",
    );
  // const uploadDir = "../client/public/tempUploads";
  // await mkdir(uploadDir, { recursive: true });
  // await writeFile(path.join(uploadDir, filename), webpBuffer);
  // const timeEnd = performance.now();
  // console.log(`Image upload took ${Math.floor(timeEnd - timeStart)} ms`);
  // return { route: `/tempUploads/${filename}`, onError };

  // delete image from server if error was anywhere further down
  // const onError = async () => {
  //   await unlink(path.join(uploadDir, filename))
  // };
  const onError = async () => {
    await drive.files.delete({
      fileId: id,
    });
  };
  // https://lh3.googleusercontent.com/d/id
  const route = `https://lh3.googleusercontent.com/d/${id}`;
  return { route, onError };
}
