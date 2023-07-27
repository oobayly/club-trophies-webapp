import * as cors from "cors";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { getDownloadURL } from "../helpers";

const app = express();

app.use(cors({
  origin: "*",
  methods: "*",
}));

app.use(bodyParser.raw({
  type: "image/*",
  limit: "10mb",
}));

app.put("/v1/emulated/clubs/:clubId/logo.png", async (req, res) => {
  const { clubId } = req.params;
  const contentType = req.headers["content-type"];
  const file = admin.storage().bucket("club-trophies.appspot.com").file(`clubs/${clubId}/logo.png`);
  const content = (req as unknown as { rawBody: Buffer }).rawBody;

  await file.save(content, {
    contentType,
  });

  return res.status(200).send({
    file: getDownloadURL(file),
  });
});

app.put("/v1/emulated/clubs/:clubId/trophies/:trophyId/files/:fileName", async (req, res) => {
  const { clubId, trophyId, fileName } = req.params;
  const contentType = req.headers["content-type"];
  const file = admin.storage().bucket("club-trophies.appspot.com").file(`clubs/${clubId}/trophies/${trophyId}/files/${fileName}`);
  const content = (req as unknown as { rawBody: Buffer }).rawBody;

  await file.save(content, {
    contentType,
  });

  return res.status(200).send({
    file: getDownloadURL(file),
  });
});

const api = functions.region("europe-west2").https.onRequest(app);

export {
  api,
};
