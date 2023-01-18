import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as fs from "fs/promises";
import * as mkdirp from "mkdirp";
import * as os from "os";
import * as path from "path";
import { spawn } from "child-process-promise";
import { v4 as uuid } from "uuid";
import { Club, Collections, TrophyFile } from "../models";
import { getDownloadURL } from "../helpers";

const ThumbSize = 300;

interface TrophyFileIds {
  clubId: string;
  trophyId: string;
  fileId: string;
  thumb: boolean;
  extension: string;
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

/** Tests if the specified object is a club burgee. */
const isClubBurgee = (object: functions.storage.ObjectMetadata): string | undefined => {
  const match = object.name?.match(/clubs\/([A-Za-z0-9]+)\/burgee\.png/);

  return match?.[1];
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

const updateClubBurgee = async (clubId: string, object: functions.storage.ObjectMetadata | undefined): Promise<void> => {
  const clubRef = admin.firestore()
    .collection(Collections.Clubs)
    .doc(clubId)
    ;
  let burgee: string | admin.firestore.FieldValue;

  if (object) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const file = admin.storage().bucket(object.bucket).file(object.name!);
    const id = file.metadata.id as string;

    burgee = file.publicUrl();

    // Remove the burgee request document as referenced by the x-goog-meta-id header
    if (id) {
      await clubRef.collection(Collections.Burgees).doc(id).delete({
        exists: false,
      });
    }
  } else {
    burgee = admin.firestore.FieldValue.delete();
  }

  await clubRef.update({
    modified: new Date().getTime(),
    burgee,
  } as Partial<Club>);
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
    modified: new Date().getTime(),
  };
  const thumb = await createThumb(object);

  if (thumb) {
    fileInfo.thumb = thumb;
  }

  const updateInfo = {
    ...fileInfo,
    uploadInfo: admin.firestore.FieldValue.delete(),
  };

  await Promise.all([
    file.makePublic(),
    ref.update(updateInfo),
  ]);
}

export const onStorageItemDelete = functions.storage.bucket().object().onDelete(async (object) => {
  let clubId: string | undefined;

  if ((clubId = isClubBurgee(object)) !== undefined) {
    await updateClubBurgee(clubId, undefined);
  }
});

export const onStorageItemFinalize = functions.storage.bucket().object().onFinalize(async (object) => {
  let clubId: string | undefined;
  let fileIds: TrophyFileIds | undefined;

  if ((clubId = isClubBurgee(object)) !== undefined) {
    await updateClubBurgee(clubId, object);
  } else if ((fileIds = isTrophyFile(object)) !== undefined) {
    if (!fileIds.thumb) {
      await updateTrophyFile(fileIds, object);
    }
  }
});
