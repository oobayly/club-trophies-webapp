import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as path from "path";
import { Boat, BoatReference, Club, ClubAdmin, ClubLogoRequest, Collections, TrophyFile, UploadInfo } from "../models";
import { AdminPath, LogoPath, SearchPath, TrophyFilePath } from "./paths";
import { IsEmulated } from "../helpers";
import { search } from "./search";

// interface TrophyIds {
//   type: "created" | "updated" | "deleted";
//   clubId: string;
//   trophyId: string;
//   fileId?: string;
//   winnerId?: string;
// }

// const addClubAndTrophyIds = async (doc: admin.firestore.DocumentSnapshot, clubId: string, trophyId?: string): Promise<void> => {
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   const { clubId: oldClubId, trophyId: oldTrophyId } = doc.data() as any;

//   if (clubId !== oldClubId || trophyId !== oldTrophyId) {
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     const value: any = {
//       clubId,
//     };

//     if (trophyId) {
//       value.trophyId = trophyId;
//     }

//     await doc.ref.update(value)
//   }
// }

// const getRefWithCollectionName = (ref: admin.firestore.DocumentReference, colName: string): admin.firestore.DocumentReference | undefined => {
//   let localRef: admin.firestore.DocumentReference | null = ref;

//   do {
//     if (localRef.parent.id === colName) {
//       return localRef;
//     }

//     localRef = localRef.parent.parent;
//   } while (localRef);

//   return undefined;
// }

// const getTrophyIds = (change: functions.Change<functions.firestore.DocumentSnapshot>): TrophyIds => {
//   const { ref } = change.after;
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   const trophyRef = getRefWithCollectionName(ref, Collections.Trophies)!;
//   // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//   const clubId = trophyRef.parent.parent!.id;

//   return {
//     type: change.after.exists ? (change.before.exists ? "updated" : "created") : "deleted",
//     clubId,
//     trophyId: trophyRef.id,
//     winnerId: getRefWithCollectionName(ref, Collections.Winners)?.id,
//     fileId: getRefWithCollectionName(ref, Collections.Files)?.id,
//   };
// }

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
export const onBoatNameChange = functions.firestore.document("{path=**}/boats/{boatId}").onUpdate(async (snapshot) => {
  const boatRef = snapshot.after.ref;
  const { name: boatName } = snapshot.after.data() as Boat;

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firestore = admin.firestore();
  const trophiesQuery = firestore
    .collectionGroup(Collections.Trophies)
    .where("boatRef", "==", boatRef)
    .where("boatName", "!=", boatName)
    .get()
    ;
  const winnersQuery = firestore
    .collectionGroup(Collections.Winners)
    .where("boatRef", "==", boatRef)
    .where("boatName", "!=", boatName)
    .get()
    ;

  const [trophies, winners] = await Promise.all([
    trophiesQuery,
    winnersQuery,
  ]);

  const batch = firestore.batch();
  const changes = updateBoatName(batch, boatName, trophies) + updateBoatName(batch, boatName, winners);

  if (changes) {
    await batch.commit();
  }
});

export const onLogoCreate = functions.firestore.document(LogoPath).onCreate(async (snapshot) => {
  const logoId = snapshot.ref.id;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const clubId = snapshot.ref.parent.parent!.id;
  const file = admin.storage().bucket().file(`${Collections.Clubs}/${clubId}/logo.png`);
  const headers = {
    "x-goog-meta-id": logoId,
  };
  let uploadUrl: string;

  if (IsEmulated) {
    // Until the emulator supports url signing...
    uploadUrl = `http://127.0.0.1:5001/club-trophies/europe-west2/api/v1/emulated/${file.name}`;
  } else {
    const signed = await file.getSignedUrl({
      action: "write",
      expires: new Date().getTime() + 3600000,
      extensionHeaders: headers,
      contentType: "image/png",
    });

    uploadUrl = signed[0];
  }

  await snapshot.ref.update({
    url: uploadUrl,
    headers,
    modified: admin.firestore.FieldValue.serverTimestamp(),
  } as Partial<ClubLogoRequest>);
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

export const onSearchCreate = functions.firestore.document(SearchPath).onCreate(async (change) => {
  await search(change);
});

// export const onTrophyWrite = functions.firestore.document(`${ClubPath}/trophies/{path=**}`).onWrite(async (change) => {
//   const ids = getTrophyIds(change);

//   if (ids.type === "created" || ids.type === "updated") {
//     const { ref } = change.after;

//     if (ref.parent.id === Collections.Trophies) {
//       // If it's a trophy then we only need to update the clubId
//       await addClubAndTrophyIds(change.after, ids.clubId);
//     } else {
//       await addClubAndTrophyIds(change.after, ids.clubId, ids.trophyId);
//     }
//   }
// });

export const onTrophyFileWrite = functions.firestore.document(TrophyFilePath).onWrite(async (change) => {
  if (!change.before.exists) {
    // Creating
    const snapshot = change.after;
    const { contentType, name } = snapshot.data() as TrophyFile;
    const extension = path.extname(name);
    const file = admin.storage().bucket().file(`${snapshot.ref.path}${extension}`);
    let uploadUrl: string;

    if (IsEmulated) {
      // Until the emulator supports url signing...
      uploadUrl = `http://127.0.0.1:5001/club-trophies/europe-west2/api/v1/emulated/${file.name}`;
    } else {
      const signed = await file.getSignedUrl({
        action: "write",
        expires: new Date().getTime() + 3600000,
        contentType,
      });

      uploadUrl = signed[0];
    }

    const uploadInfo: UploadInfo = {
      url: uploadUrl,
      headers: {
        "Content-Type": contentType,
      },
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
