import { File } from "@google-cloud/storage";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuid } from "uuid";

const DownloadTokenKey = "firebaseStorageDownloadTokens";

export const IsEmulated = process.env["FUNCTIONS_EMULATOR"];

/** Gets the download URL for the specfied storage object. */
async function getDownloadURL(object: functions.storage.ObjectMetadata | File): Promise<string> {
  let metadata: { [key: string]: string };
  let file: File;

  if (object instanceof File) {
    metadata = (await object.getMetadata())[0];
    file = object;
  } else {
    metadata = object.metadata || {};
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    file = admin.storage().bucket(object.bucket).file(object.name!);
  }

  if (IsEmulated) {
    return file.publicUrl();
  }

  let token = `${metadata[DownloadTokenKey]}`.split(/,/)[0];

  if (!token) {
    metadata[DownloadTokenKey] = token = uuid();

    await file.setMetadata({
      metadata,
    });
  }

  return `https://firebasestorage.googleapis.com/v0/b/${file.bucket}/o/${encodeURIComponent(file.name)}?alt=media&token=${token}`;
}

export {
  getDownloadURL,
}
