import express = require("express");
import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { Collections, Winner } from "../models";
import { legacyClasses, legacyTrophies, legacyWinners } from "./legacy";

// http://127.0.0.1:5001/club-trophies/us-central1/importer

const ClubId = "I0PPhPQPbiqFsE8pmhoI";
const BoatMap = new Map<number, string>();

const loadBoats = async (): Promise<void> => {
  const db = admin.firestore();
  const snapshot = await db.collectionGroup(Collections.Boats).get();
  const boats = snapshot.docs.reduce((accum, item) => {
    return accum.set(item.data().name, item.ref.path);
  }, new Map<string, string>());

  for (const item of legacyClasses) {
    const boatRef = boats.get(item.fldName);

    if (!boatRef) {
      throw new Error(`No boat found called '${item.fldName}'`);
    }

    BoatMap.set(item.fldClassID, boatRef);
  }
}

const loadTrophies = async (): Promise<void> => {
  const db = admin.firestore();
  const clubDoc = db.collection(Collections.Clubs).doc(ClubId);

  for (let i = 0; i < legacyTrophies.length; i++) {

    const batch = db.batch();

    const item = legacyTrophies[i];
    const legacyClass = legacyClasses.find((x) => x.fldClassID === item.fldCurrentClassID)!;
    const boatRef = BoatMap.get(legacyClass.fldClassID)!;
    const boatName = legacyClass.fldName;
    const trophyDoc = clubDoc.collection(Collections.Trophies).doc();
    const trophy = {
      clubId: ClubId,
      conditions: item.fldConditions,
      details: item.fldDetails,
      donated: `${item.fldYearDonated}`,
      donor: item.fldDonor,
      name: item.fldName,
      page: item.fldRedBookPage ? `${item.fldRedBookPage}` : "",
      public: true,
      created: new Date(item.fldCreated),
      modified: item.fldModified ? new Date(item.fldModified) : null,
      boatRef: db.doc(boatRef),
      boatName,
    };

    console.log(`Trophy ${i + 1} of ${legacyTrophies.length} : ${item.fldName}`);

    batch.set(trophyDoc, trophy);

    loadWinners(batch, item.fldTrophyID, trophyDoc.id);

    // Mapping.trophies.set(item.fldTrophyID, trophyDoc.id);

    batch.commit();
    // break;
  }
}

const loadWinners = (batch: firestore.WriteBatch, legacyTrophyId: number, trophyId: string): void => {
  const db = admin.firestore();
  const clubDoc = db.collection(Collections.Clubs).doc(ClubId);

  legacyWinners
    .filter((item) => item.fldTrophyID === legacyTrophyId)
    .forEach((item, index, arr) => {
      const legacyClass = legacyClasses.find((x) => x.fldClassID === item.fldClassID)!;
      const boatRef = BoatMap.get(legacyClass.fldClassID)!;
      const boatName = legacyClass.fldName;
      const winnerDoc = clubDoc.collection(Collections.Trophies).doc(trophyId).collection(Collections.Winners).doc();

      let sail: string = item.fldSailNumber;
      let name = "";

      if (sail === boatName) {
        sail = "";
      } else if (boatName === "Cruiser" || boatName === "Yacht") {
        name = sail;
        sail = "";
      }

      const winner: Winner = {
        boatName,
        boatRef: db.doc(boatRef),
        club: "",
        parent: { clubId: ClubId, trophyId },
        crew: item.fldCrew,
        helm: item.fldHelm,
        name,
        notes: "",
        sail,
        owner: item.fldOwner,
        year: item.fldYear,
        created: new Date(item.fldCreated),
        modified: item.fldModified ? new Date(item.fldModified) : null,
      };

      // console.log(`  Winner ${index + 1} of ${arr.length} : ${item.fldYear} : ${item.fldHelm}`);

      batch.set(winnerDoc, winner);
    });
}

const app = express();

// app.get("/modify", async (req, res) => {
//   console.log("foo");
//   const db = admin.firestore();
//   const batch = db.batch();

//   const trophies = await db.collectionGroup(Collections.Trophies).get();
//   const winners = await db.collectionGroup(Collections.Winners).get();
//   const files = await db.collectionGroup(Collections.Files).get();

//   trophies.docs.forEach((item) => {
//     const clubId = item.ref.parent.parent!.id;
//     console.log(item.data());

//     batch.update(item.ref, {
//       clubId: admin.firestore.FieldValue.delete(),
//       parent: { clubId },
//     });
//   });

//   winners.docs.forEach((item) => {
//     const clubId = item.ref.parent.parent!.parent.parent!.id;
//     const trophyId = item.ref.parent.parent!.id;
//     console.log(item.data());

//     batch.update(item.ref, {
//       clubId: admin.firestore.FieldValue.delete(),
//       trophyId: admin.firestore.FieldValue.delete(),
//       parent: { clubId, trophyId },
//     });
//   });

//   files.docs.forEach((item) => {
//     const clubId = item.ref.parent.parent!.parent.parent!.id;
//     const trophyId = item.ref.parent.parent!.id;
//     console.log({
//       clubId: admin.firestore.FieldValue.delete(),
//       trophyId: admin.firestore.FieldValue.delete(),
//       parent: { clubId, trophyId },
//     });

//     batch.update(item.ref, {
//       clubId: admin.firestore.FieldValue.delete(),
//       trophyId: admin.firestore.FieldValue.delete(),
//       parent: { clubId, trophyId },
//     });
//   });

//   await batch.commit();

//   res.status(200).send();
// });

app.get("import", async (req, res) => {
  await loadBoats();

  await loadTrophies();

  // console.log(Mapping.boats);
  // console.log(Mapping.trophies);

  res.status(200).send();
});


export const importer = functions.https.onRequest(app);
