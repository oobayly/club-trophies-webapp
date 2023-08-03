import * as admin from "firebase-admin";
import { onBoatNameChange, onLogoCreate, onClubAdminWrite, onTrophyFileWrite, onSearchCreate, onClubBoatNameChange, onClubWrite } from "./firestore";
import { api } from "./https";
import { onStorageItemFinalize } from "./storage";
import { IsEmulated } from "./helpers";
import { importer } from "./importer";

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
