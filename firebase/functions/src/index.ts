import * as admin from "firebase-admin";
import { onBoatNameChange, onBurgeeCreate, onTrophyFileCreate, onTrophyFileDelete } from "./firestore";
// import { api } from "./https";
import { onStorageItemDelete, onStorageItemFinalize } from "./storage";

admin.initializeApp();

// exports.api = api;

exports.onBoatNameChange = onBoatNameChange;
exports.onBurgeeCreate = onBurgeeCreate;
exports.onTrophyFileCreate = onTrophyFileCreate;
exports.onTrophyFileDelete = onTrophyFileDelete;

exports.onStorageItemDelete = onStorageItemDelete;
exports.onStorageItemFinalize = onStorageItemFinalize;
