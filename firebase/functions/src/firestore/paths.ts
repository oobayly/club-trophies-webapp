import { Collections } from "../models";

export const ClubPath = `${Collections.Clubs}/{clubId}`;
export const BoatPath = `${ClubPath}/${Collections.Boats}/{boatId}`;
export const AdminPath = `${ClubPath}/${Collections.Admins}/{id}`;
export const LogoPath = `${ClubPath}/${Collections.Logos}/{loogId}`;
export const TrophiesPath = `${ClubPath}/${Collections.Trophies}/{trophyId}`;
export const TrophyFilePath = `${ClubPath}/${Collections.Trophies}/{trophyId}/${Collections.Files}/{fileId}`;
export const WinnerPath = `${TrophiesPath}/${Collections.Winners}/{winnerId}`;

export const SearchPath = `${Collections.Searches}/{searchId}`;
export const SearchResultsPath = `${SearchPath}/${Collections.SearchResults}/{resultId}`;
