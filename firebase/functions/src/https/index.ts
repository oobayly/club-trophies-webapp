import * as cors from "cors";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as admin from "firebase-admin";
import { getDownloadURL } from "firebase-admin/storage";
import * as functions from "firebase-functions";

const app = express();
const httpsFunctions = functions.region("europe-west2").https;

app.use(cors({
  origin: "*",
  methods: "*",
}));

app.use(bodyParser.raw({
  type: "image/*",
  limit: "10mb",
}));

app.put("/v1/emulated/clubs/:clubId/logos/:logoId.png", async (req, res) => {
  const { clubId, logoId } = req.params;
  const contentType = req.headers["content-type"];
  const file = admin.storage().bucket("club-trophies.appspot.com").file(`clubs/${clubId}/logos/${logoId}.png`);
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

const api = httpsFunctions.onRequest(app);

export {
  api,
};
