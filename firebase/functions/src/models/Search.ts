import { TimestampType } from "./interfaces";
import { Winner } from "./Winner";

export interface Search {
  uid: string | null;
  clubId: string | null;
  sail: string | null;
  boatName: string | null;
}

export interface SearchResult extends Omit<Winner, "notes" | "created" | "modified" | "boatRef"> {
  clubName: string;
  trophyName: string;
}

export interface SearchResultList {
  page: number;
  expireAfter: TimestampType;
  results: SearchResult[];
}
