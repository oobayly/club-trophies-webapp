import * as admin from "firebase-admin";
import { onBoatNameChange, onClubAdminWrite, onClubBoatNameChange, onClubWrite, onLogoCreate, onSearchCreate, onTrophyFileWrite } from "./firestore";
import { IsEmulated } from "./helpers";
import { api } from "./https";
import { importer } from "./importer";
import { onStorageItemFinalize } from "./storage";

admin.initializeApp({
  storageBucket: "club-trophies.appspot.com",
});

if (IsEmulated) {
  exports.api = api;
  exports.importer = importer;
}

exports.onBoatNameChange = onBoatNameChange;
exports.onClubWrite = onClubWrite;
exports.onClubBoatNameChange = onClubBoatNameChange;
exports.onClubAdminWrite = onClubAdminWrite;
exports.onLogoCreate = onLogoCreate;
exports.onTrophyFileWrite = onTrophyFileWrite;
exports.onSearchCreate = onSearchCreate;

// exports.onStorageItemDelete = onStorageItemDelete;
exports.onStorageItemFinalize = onStorageItemFinalize;
