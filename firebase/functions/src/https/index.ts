import * as cors from "cors";
import * as express from "express";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Club, Collections } from "../models";
import { AuthRequest, checkIfAuthenticated } from "./jwt-hander";

const getClub = async (clubId: string): Promise<admin.firestore.DocumentSnapshot<Club>> => {
  const ref = admin.firestore().collection(Collections.Clubs).doc(clubId);

  return await ref.get() as admin.firestore.DocumentSnapshot<Club>;
}

const app = express();

app.use(cors({
  origin: "*",
  methods: "*",
}));

app.get("/v1/clubs/:clubId/logo", async (req, res) => {
  const { clubId } = req.params;

  try {
    const file = await admin.storage().bucket().file(`clubs/${clubId}/logo.png`).get();

    return res.redirect(file[0].publicUrl());
  } catch {
    return res.sendStatus(404);
  }
});

app.post("/v1/clubs/:clubId/logo", checkIfAuthenticated, async (req: AuthRequest, res) => {
  const club = await getClub(req.params.clubId);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const uid = req.idToken!.uid;

  if (!club.exists) {
    return res.sendStatus(404);
  } else if (!club.data()?.admins?.includes(uid)) {
    return res.sendStatus(403);
  }

  return res.status(200).send({ idToken: req.idToken });
});

app.get("*", (req, res) => {
  functions.logger.debug(`Not Found: ${req.path}`);
  res.sendStatus(404);
});

const api = functions.region("europe-west2").https.onRequest(app);

export {
  api,
};
