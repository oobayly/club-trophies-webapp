import { HasExpires } from "./interfaces";
import { Winner } from "./Winner";

export interface SearchClubInfo {
  clubId: string
  name: string;
  trophies: SearchTrophyInfo[];
  isAdmin?: boolean;
}

export interface SearchTrophyInfo {
  trophyId: string;
  name: string;
}

export interface Search extends HasExpires {
  uid?: string;
  clubId?: string;
  trophyId?: string;
  sail?: string;
  boatName?: string;
  /** The club information, generated by the firestore function. */
  clubs?: SearchClubInfo[];
  count?: number;
}

export interface SearchWithResults extends Search, HasExpires {
  /** The clubs */
  clubs: SearchClubInfo[];
  /** The search results. */
  results: SearchResult[];
}

export type SearchResult = Omit<Winner, "notes" | "created" | "modified" | "boatRef">

export interface SearchResultList extends HasExpires {
  page: number;
  results: SearchResult[];
}
