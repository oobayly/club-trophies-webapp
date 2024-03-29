import { HasExpires, HasPublic, HasTimestamp, HasUploadInfo } from "./interfaces";

export interface Club extends HasPublic, HasTimestamp {
  /** The list of uids that have admin access. */
  admins: string[];
  /** The URL to the club logo image. */
  logo?: string;
  /** The 3-character ISO 3166 country code for the location of the club. */
  country: string;
  /** The full name of the club. */
  name: string;
  /** The short name of the club. */
  shortName: string;
}

export interface ClubAdmin extends HasTimestamp {
  /** The name of the club. */
  club: string;
  /** A flag indicating that the request is enabled. */
  enabled: boolean;
  /** The name of the user making the request. */
  name: string;
  /** The uid of the user requesting access. */
  uid: string;
}

export interface ClubEvent extends HasTimestamp {
  /** The name of the event. */
  name: string;
}

export type ClubLogoRequest = HasExpires & HasTimestamp & HasUploadInfo;
