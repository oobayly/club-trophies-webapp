import express = require("express");
import * as admin from "firebase-admin";
import { firestore } from "firebase-admin";
import * as functions from "firebase-functions";
import { Collections, Trophy, Winner } from "../models";
import { legacyClasses, legacyTrophies, legacyWinners } from "./legacy";

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
      modified: item.fldModified ? new Date(item.fldModified) : null,
      boatRef: db.doc(boatRef),
      boatName,
      parent: { clubId: ClubId },
    };

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
        modified: item.fldModified ? new Date(item.fldModified) : null,
      };

      batch.set(winnerDoc, winner);
    });
}

// http://127.0.0.1:5001/club-trophies/us-central1/importer
const app = express();

app.get("/modify", async (_req, res) => {
  res.status(200).send();
});

app.get("/import", async (_req, res) => {
  await loadBoats();

  await loadTrophies();

  // console.log(Mapping.boats);
  // console.log(Mapping.trophies);

  res.status(200).send();
});


export const importer = functions.https.onRequest(app);
