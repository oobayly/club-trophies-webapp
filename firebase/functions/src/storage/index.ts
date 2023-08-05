import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as fs from "fs/promises";
import { mkdirp } from "mkdirp";
import * as os from "os";
import * as path from "path";
import { spawn } from "child-process-promise";
import { v4 as uuid } from "uuid";
import { Club, Collections, TrophyFile } from "../models";
import { getDownloadURL } from "firebase-admin/storage";
import { FieldValue } from "firebase-admin/firestore";

const storageFunctions = functions.region("europe-west2").storage;
const ThumbSize = 300;

interface TrophyFileIds {
  clubId: string;
  trophyId: string;
  fileId: string;
  thumb: boolean;
  extension: string;
}

interface LogoFileIds {
  clubId: string;
  logoId: string;
}

const createThumb = async (object: functions.storage.ObjectMetadata): Promise<string | undefined> => {
  if (!object.name || !object.contentType) {
    return undefined;
  } else if (!/^image/i.test(object.contentType)) {
    return undefined;
  }

  // Remote file info
  const bucket = admin.storage().bucket(object.bucket);
  const imageName = path.basename(object.name);
  const extension = path.extname(imageName);
  const remotePath = path.dirname(object.name);
  const thumbName = `${path.parse(imageName).name}-th${extension}`;
  const remoteThumbPath = path.normalize(path.join(remotePath, thumbName));

  // Local file info
  const tempPath = path.join(os.tmpdir(), uuid());
  const tempImagePath = path.join(tempPath, imageName);
  const tempThumbPath = path.join(tempPath, thumbName);

  await mkdirp(tempPath);

  try {
    await bucket.file(object.name).download({ destination: tempImagePath });

    await spawn("convert", [
      tempImagePath,
      "-thumbnail", `${ThumbSize}x${ThumbSize}>`,
      tempThumbPath,
    ], {
      capture: ["stderr", "stdout"],
    });

    const resp = await bucket.upload(tempThumbPath, {
      destination: remoteThumbPath,
      contentType: object.contentType,
      metadata: {
        contentDisposition: "inline",
      },
      public: true,
    });

    return await getDownloadURL(resp[0]);
  } catch (e) {
    functions.logger.debug(`${object.bucket} - ${object.name} could not be thumbnailed`);

    return undefined;
  } finally {
    await fs.rm(tempPath, { force: true, recursive: true });
  }
}

/** Tests if the specified object is a club logo. */
const isClubLogo = (object: functions.storage.ObjectMetadata): LogoFileIds | undefined => {
  const match = object.name?.match(/clubs\/([A-Za-z0-9]+)\/logos\/([A-Za-z0-9]+)\.png/);

  if (match) {
    const [, clubId, logoId] = match;

    return {
      clubId,
      logoId,
    };
  }

  return undefined;
}

/** Tests if the specified object is a trophy photo. */
const isTrophyFile = (object: functions.storage.ObjectMetadata): TrophyFileIds | undefined => {
  const match = object.name?.match(/clubs\/([A-Za-z0-9]+)\/trophies\/([A-Za-z0-9]+)\/files\/([A-Za-z0-9]+)(-th)?(.+)$/);

  if (match) {
    const [, clubId, trophyId, fileId, thumb, extension] = match;

    return {
      clubId,
      trophyId,
      fileId,
      thumb: !!thumb,
      extension,
    };
  }

  return undefined;
}

const updateClubLogo = async (ids: LogoFileIds, object: functions.storage.ObjectMetadata): Promise<void> => {
  const { clubId, logoId } = ids;
  const db = admin.firestore();
  const batch = db.batch();
  const clubRef = db.collection(Collections.Clubs).doc(clubId);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const logo = await getDownloadURL(admin.storage().bucket(object.bucket).file(object.name!));
  const logoFiles = await admin.storage().bucket().getFiles({
    prefix: `${clubRef.path}/logos`,
  });
  const deletePromises = logoFiles[0]
    .filter((x) => !x.name.includes(logoId)) // All logos except the one just created
    .map((x) => x.delete())
    ;

  // Remove the logo request document as referenced by the x-goog-meta-id header
  batch.delete(clubRef.collection(Collections.Logos).doc(logoId));
  batch.update(clubRef, {
    modified: FieldValue.serverTimestamp(),
    logo,
  } as Partial<Club>);

  await Promise.all([
    batch.commit(),
    ...deletePromises,
  ]);
}

const updateTrophyFile = async (ids: TrophyFileIds, object: functions.storage.ObjectMetadata): Promise<void> => {
  const ref = admin.firestore()
    .collection(Collections.Clubs).doc(ids.clubId)
    .collection(Collections.Trophies).doc(ids.trophyId)
    .collection(Collections.Files).doc(ids.fileId)
    ;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const file = admin.storage().bucket(object.bucket).file(object.name!);
  const fileInfo: Partial<TrophyFile> = {
    url: await getDownloadURL(file),
    contentType: object.contentType,
    modified: FieldValue.serverTimestamp(),
  };
  const thumb = await createThumb(object);

  if (thumb) {
    fileInfo.thumb = thumb;
  }

  const updateInfo = {
    ...fileInfo,
    expireAfter: FieldValue.delete(), // Ensure that thre request isn't expired
    uploadInfo: FieldValue.delete(),
  };

  await Promise.all([
    file.makePublic(),
    ref.update(updateInfo),
  ]);
}

// export const onStorageItemDelete = storageFunctions.bucket().object().onDelete(async (object) => {
// });

export const onStorageItemFinalize = storageFunctions.bucket().object().onFinalize(async (object) => {
  let clubIds: LogoFileIds | undefined;
  let fileIds: TrophyFileIds | undefined;

  if ((clubIds = isClubLogo(object)) !== undefined) {
    await updateClubLogo(clubIds, object);
  } else if ((fileIds = isTrophyFile(object)) !== undefined) {
    if (!fileIds.thumb) {
      await updateTrophyFile(fileIds, object);
    }
  }
});
