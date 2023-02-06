import { Collections } from "../models";

export const ClubPath = `${Collections.Clubs}/{clubId}`;
export const BoatPath = `${ClubPath}/${Collections.Boats}/{boatId}`;
export const AdminPath = `${ClubPath}/${Collections.Admins}/{id}`;
export const LogoPath = `${ClubPath}/${Collections.Logos}/{loogId}`;
export const TrophyFilePath = `${ClubPath}/${Collections.Trophies}/{trophyId}/${Collections.Files}/{fileId}`;
