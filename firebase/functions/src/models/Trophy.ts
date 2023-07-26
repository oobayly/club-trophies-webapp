import { BoatReference } from "./Boat";
import { HasPublic, HasTimestamp, UploadInfo } from "./interfaces";

export interface Trophy extends HasPublic, HasTimestamp, BoatReference {
  /** The conditions for the trophy being awarded. */
  conditions: string;
  /** The details of the trophy. */
  details: string;
  /** The year that the trophy was donated. */
  donated: string;
  /** The name of the donor. */
  donor: string;
  /** The name of the trophy. */
  name: string;
  /** The page number in the historic book. */
  page: string;
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

