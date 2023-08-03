import { BoatReference } from "./Boat";
import { HasClubParent, HasExpires, HasPublic, HasTimestamp, HasTrophyParent, HasUploadInfo } from "./interfaces";

export interface Trophy extends HasClubParent, HasPublic, HasTimestamp, BoatReference {
  /** The conditions for the trophy being awarded. */
  conditions: string;
  /** The details of the trophy. */
  details: string;
  /** The year that the trophy was donated. */
  donated: string;
  /** The name of the donor. */
  donor: string;
  /** The ID event in which the tophy is presented. */
  eventId: string | null;
  /** The name of the trophy. */
  name: string;
  /** The page number in the historic book. */
  page: string;
}

export interface TrophyFile extends HasExpires, HasTimestamp, HasTrophyParent, HasUploadInfo {
  /** The file MIME type. */
  contentType: string;
  /** The file description. */
  description: string;
  /** The original name of the file. */
  name: string;
  /** The url to the file. */
  url: string | null;
  /** The thumbnail if the file is an image. */
  thumb: string | null;
}

