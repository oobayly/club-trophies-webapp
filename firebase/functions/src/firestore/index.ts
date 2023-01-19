import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import { Boat, BoatReference, Club, ClubAdmin, ClubBurgeeRequest, Collections, TrophyFile, UploadInfo } from "../models";
import { AdminPath, BoatPath, BurgeePath, TrophyFilePath } from "./paths";

const updateBoatName = (batch: admin.firestore.WriteBatch, boatName: string, docs: admin.firestore.QuerySnapshot<admin.firestore.DocumentData>): number => {
  let changes = 0;

  docs.forEach((doc) => {
    const { boatName: oldName } = doc.data() as BoatReference;

    if (oldName !== boatName) {
      changes++;
      batch.update(doc.ref, { boatName });
    }
  });

  return changes;
}

/** Ensures that the boat names are kept up-to-date across trophies and winners. */
export const onBoatNameChange = functions.firestore.document(BoatPath).onUpdate(async (snapshot) => {
  const boatId = snapshot.after.id;
  const { name: boatName } = snapshot.after.data() as Boat;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const clubRef = snapshot.after.ref.parent.parent!;
  const trophiesQuery = clubRef
    .collection(Collections.Trophies)
    .where("boatId", "==", boatId)
    .where("boatName", "!=", boatName)
    .get()
    ;
  const winnersQuery = clubRef.firestore
    .collectionGroup(Collections.Winners)
    .where("boatId", "==", boatId)
    // .where("boatName", "!=", boatName) Can't do this with the order by
    .orderBy(admin.firestore.FieldPath.documentId())
    .startAt(clubRef.path)
    .endAt(`${clubRef.path}\uf8ff`)
    .get()
    ;

  const [trophies, winners] = await Promise.all([
    trophiesQuery,
    winnersQuery,
  ]);

  if (!trophies.size && !winners.size) {
    return;
  }

  const batch = clubRef.firestore.batch();
  const changes = updateBoatName(batch, boatName, trophies) + updateBoatName(batch, boatName, winners);

  if (changes) {
    await batch.commit();
  }
});

export const onBurgeeCreate = functions.firestore.document(BurgeePath).onCreate(async (snapshot) => {
  const burgeeId = snapshot.ref.id;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const clubId = snapshot.ref.parent.parent!.id;
  const file = admin.storage().bucket().file(`${Collections.Clubs}/${clubId}/burgee.png`);
  const headers = {
    "x-goog-meta-id": burgeeId,
  };
  const uploadUrl = await file.getSignedUrl({
    action: "write",
    expires: new Date().getTime() + 3600000,
    extensionHeaders: headers,
    contentType: "image/png",
  });

  await snapshot.ref.update({
    url: uploadUrl[0],
    headers,
    modified: new Date().getTime(),
  } as Partial<ClubBurgeeRequest>);
});

export const onClubAdminWrite = functions.firestore.document(AdminPath).onWrite(async (change) => {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const clubRef = change.after.ref.parent.parent!;
  const isWriting = change.after.exists;
  const { uid, enabled } = (change.after.data() || change.before.data()) as ClubAdmin;

  await clubRef.firestore.runTransaction(async (trans) => {
    const clubDoc = await trans.get(clubRef);
    const { admins } = clubDoc.data() as Club;
    const containsUid = admins.includes(uid);
    let update: Partial<Club>;

    if (isWriting && enabled && !containsUid) {
      update = {
        admins: [...admins, uid],
      };
    } else if (containsUid) {
      update = {
        admins: admins.filter((x) => x !== uid),
      };
    } else {
      // Nothing to change
      return;
    }

    trans.update(clubRef, update);
  });
});

export const onTrophyFileWrite = functions.firestore.document(TrophyFilePath).onWrite(async (change) => {
  if (!change.before.exists) {
    // Creating
    const snapshot = change.after;
    const { name } = snapshot.data() as TrophyFile;
    const extension = path.extname(name);
    const file = admin.storage().bucket().file(`${snapshot.ref.path}${extension}`);
    const uploadUrl = await file.getSignedUrl({
      action: "write",
      expires: new Date().getTime() + 3600000,
    });
    const uploadInfo: UploadInfo = {
      url: uploadUrl[0],
      headers: {},
    };

    await snapshot.ref.update({ uploadInfo });
  } else if (!change.after.exists) {
    // Deleting
    const snapshot = change.before;
    const resp = await admin.storage().bucket().getFiles({
      prefix: snapshot.ref.path,
    });

    // There should only be two storage object per file, so it's safe to delete all the items in parallel
    await Promise.all(resp[0].map((item) => item.delete()));
  }
});
