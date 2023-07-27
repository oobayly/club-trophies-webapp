import * as admin from "firebase-admin";
import { onBoatNameChange, onLogoCreate, onClubAdminWrite, onTrophyFileWrite } from "./firestore";
import { api } from "./https";
import { onStorageItemDelete, onStorageItemFinalize } from "./storage";
import { IsEmulated } from "./helpers";

admin.initializeApp();

if (IsEmulated) {
  exports.api = api;
}

exports.onBoatNameChange = onBoatNameChange;
exports.onClubAdminWrite = onClubAdminWrite;
exports.onLogoCreate = onLogoCreate;
exports.onTrophyFileWrite = onTrophyFileWrite;

exports.onStorageItemDelete = onStorageItemDelete;
exports.onStorageItemFinalize = onStorageItemFinalize;
