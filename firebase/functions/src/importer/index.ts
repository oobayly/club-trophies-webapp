import express = require("express");
import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { Boat, Collections, Trophy, Winner, removeEmptyStrings } from "../models";
import { ClubId, legacyClasses, legacyTrophies, legacyWinners } from "./legacy";

const httpsFunctions = functions.region("europe-west2").https;
const BoatMap = new Map<number, string>();

const loadBoats = async (): Promise<void> => {
  const db = admin.firestore();
  const batch = db.batch();

  for (const item of legacyClasses) {
    let doc: firestore.DocumentReference<firestore.DocumentData>;

    if (item.clubId) {
      doc = db.collection(Collections.Clubs).doc(item.clubId).collection(Collections.Boats).doc();
    } else {
      doc = db.collection(Collections.Boats).doc();
    }

    const boat: Boat = {
      archived: false,
      name: item.fldName,
      created: new Date(item.fldCreated),
    };

    if (item.fldModified) {
      boat.modified = new Date(item.fldModified);
    }

    batch.set(doc, boat);

    BoatMap.set(item.fldClassID, doc.path);
  }

  await batch.commit();
}

const loadTrophies = async (): Promise<void> => {
  const db = admin.firestore();
  const clubDoc = db.collection(Collections.Clubs).doc(ClubId);

  for (let i = 0; i < legacyTrophies.length; i++) {

    const batch = db.batch();

    const item = legacyTrophies[i];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const legacyClass = legacyClasses.find((x) => x.fldClassID === item.fldCurrentClassID)!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const boatRef = BoatMap.get(legacyClass.fldClassID)!;
    const boatName = legacyClass.fldName;
    const trophyDoc = clubDoc.collection(Collections.Trophies).doc();
    const trophy: Trophy = {
      conditions: item.fldConditions,
      details: item.fldDetails,
      donated: `${item.fldYearDonated}`,
      donor: item.fldDonor,
      name: item.fldName,
      page: item.fldRedBookPage ? `${item.fldRedBookPage}` : "",
      public: true,
      created: new Date(item.fldCreated),
      boatRef: db.doc(boatRef),
      boatName,
      parent: { clubId: ClubId },
    };

    if (item.fldModified) {
      trophy.modified = new Date(item.fldModified);
    }

    removeEmptyStrings(trophy, ["conditions", "details", "donated", "donor", "name", "page"]);

    console.log(`Trophy ${i + 1} of ${legacyTrophies.length} : ${item.fldName}`);

    batch.set(trophyDoc, trophy);

    loadWinners(batch, item.fldTrophyID, trophyDoc.id);

    batch.commit();
  }
}

const loadWinners = (batch: firestore.WriteBatch, legacyTrophyId: number, trophyId: string): void => {
  const db = admin.firestore();
  const clubDoc = db.collection(Collections.Clubs).doc(ClubId);

  legacyWinners
    .filter((item) => item.fldTrophyID === legacyTrophyId)
    .forEach((item) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const legacyClass = legacyClasses.find((x) => x.fldClassID === item.fldClassID)!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        suppress: false,
      };

      if (item.fldModified) {
        winner.modified = new Date(item.fldModified);
      }

      removeEmptyStrings(winner, ["club", "crew", "helm", "name", "notes", "owner", "sail"]);

      batch.set(winnerDoc, winner);
    });
}

// http://127.0.0.1:5001/club-trophies/europe-west2/importer
const app = express();

app.get("/modify", async (_req, res) => {
  const db = admin.firestore();
  const winners = await db.collectionGroup(Collections.Winners).get();
  let batch: firestore.WriteBatch | undefined;

  for (let i = 0; i < winners.size; i++) {
    if (i % 500 === 0) {
      if (batch) {
        batch.commit();
      }

      batch = db.batch();
    }

    batch?.update(winners.docs[i].ref, { suppress: false });
  }

  if (batch) {
    await batch?.commit();
  }

  // // Remove empty data from the winners
  // const db = admin.firestore();
  // const trophies = await db.collectionGroup(Collections.Trophies).get();

  // for (let i = 0; i < trophies.size; i++) {
  //   const doc = trophies.docs[i];
  //   const { clubId } = doc.data().parent;
  //   const batch = db.batch();

  //   const winners = await db.collection(Collections.Clubs).doc(clubId).collection(Collections.Trophies).doc(doc.id).collection(Collections.Winners).get();

  //   winners.forEach((x) => {
  //     const data = x.data();

  //     Object.keys(data).forEach((k) => {
  //       if (!data[k]) {
  //         data[k] = FieldValue.delete();
  //       }
  //     });

  //     batch.update(x.ref, data);
  //   });

  //   await batch.commit();
  // }

  res.status(200).send();
});

app.get("/import", async (_req, res) => {
  await loadBoats();

  await loadTrophies();

  // console.log(Mapping.boats);
  // console.log(Mapping.trophies);

  res.status(200).send();
});


export const importer = httpsFunctions.onRequest(app);
