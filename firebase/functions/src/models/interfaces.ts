export interface DocumentRef {
  id: string;
  path: string;
}

export interface HasPublic {
  /** A flag indicating whether the record is public. */
  public: boolean;
}

interface FbTimestamp {
  toDate: () => Date;
  toMillis: () => number;
}

export type TimestampType = FbTimestamp | object;

export interface HasTimestamp {
  /** The timestamp of when the record was created. */
  created: TimestampType;
  /** The timestamp of when the record was last modified. */
  modified: TimestampType | null;
}

/** These properties are added by the firestore functions */
export interface HasTrophyParent {
  /** The ID of the parent club. */
  clubId: string;
  /** TheID of the parent trophy.  */
  trophyId: string;
}

export interface UploadInfo {
  /** The signed URL to be used for uploading the file. */
  url: string;
  /** The headers to use when uploading the file. */
  headers: { [key: string]: string };
}
