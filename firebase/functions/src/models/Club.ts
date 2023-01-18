import { HasPublic, HasTimestamp, UploadInfo } from "./interfaces";

export interface Club extends HasPublic, HasTimestamp {
  /** The list of uids that have admin access. */
  admins: string[];
  /** The URL to the club burgee image. */
  burgee?: string;
  /** The 3-character ISO 3166 country code for the location of the club. */
  country: string;
  /** The full name of the club. */
  name: string;
  /** The short name of the club. */
  shortName: string;
}

export type ClubBurgeeRequest = UploadInfo & HasTimestamp;

export interface ClubRequest extends HasTimestamp {
  /** The name of the club. */
  club: string;
  /** The name of the user making the request. */
  name: string;
  /** The uid of the user requesting access. */
  uid: string;
}
