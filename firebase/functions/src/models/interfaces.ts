export interface DocumentRef {
  id: string;
  path: string;
}

export interface HasPublic {
  /** A flag indicating whether the record is public. */
  public: boolean;
}

export interface HasParent<T> {
  /** An object that contains the IDs of the parent objects. */
  parent: T;
}

export type HasClubParent = HasParent<{ clubId: string }>;
export type HasTrophyParent = HasParent<{ clubId: string, trophyId: string }>;

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

export interface UploadInfo {
  /** The signed URL to be used for uploading the file. */
  url: string;
  /** The headers to use when uploading the file. */
  headers: { [key: string]: string };
}
