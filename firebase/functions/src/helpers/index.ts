import { File } from "@google-cloud/storage";
import * as admin from "firebase-admin";
import { getDownloadURL } from "firebase-admin/storage";
import { storage } from "firebase-functions";
export const IsEmulated = process.env["FUNCTIONS_EMULATOR"];

/** A wrapper that handles getting the download url on the emulator as well as in production. */
export async function getDownloadUrlSafe(value: File | storage.ObjectMetadata): Promise<string> {
  let file: File;
  if (value instanceof File) {
    file = value;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    file = admin.storage().bucket(value.bucket).file(value.name!);
  }

  if (IsEmulated) {
    return file.publicUrl();
  }

  return await getDownloadURL(file);
}
