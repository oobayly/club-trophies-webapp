import { BoatReference } from "./Boat";
import { HasPublic, HasTimestamp, UploadInfo } from "./interfaces";

export type TrophyType = "sailing" | "pavilion";

export interface Trophy extends HasPublic, HasTimestamp {
  /** The conditions for the trophy being awarded. */
  conditions: string;
  /** The details of the trophy. */
  details: string;
  /** The year that the trophy was donated. */
  donated?: number;
  /** The name of the donor. */
  donor: string;
  /** The name of the trophy. */
  name: string;
  /** The page number in the historic book. */
  page?: number;
  /** The type of trophy. */
  type: TrophyType;
}

export interface SailingTrophy extends BoatReference, Trophy {
  type: "sailing";
}

export interface PavilionTrophy extends Trophy {
  type: "pavilion";
}

export interface TrophyFile extends HasTimestamp {
  /** The file MIME type. */
  contentType: string;
  /** The file description. */
  description: string;
  /** The original name of the file. */
  name: string;
  /** The upload information. */
  uploadInfo?: UploadInfo;
  /** The url to the file. */
  url?: string;
  /** The thumbnail if the file is an image. */
  thumb?: string;
}

