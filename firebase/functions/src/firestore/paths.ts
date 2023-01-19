import { Collections } from "../models";

export const ClubPath = `${Collections.Clubs}/{clubId}`;
export const BoatPath = `${ClubPath}/${Collections.Boats}/{boatId}`;
export const AdminPath = `${ClubPath}/${Collections.Admins}/{id}`;
export const BurgeePath = `${ClubPath}/${Collections.Burgees}/{burgeeId}`;
export const TrophyFilePath = `${ClubPath}/${Collections.Trophies}/{trophyId}/${Collections.Files}/{fileId}`;
