export interface HasPublic {
  /** A flag indicating whether the record is public. */
  public: boolean;
}

interface FbTimestamp {
  toDate: () => Date;
  compareTo: (other: FbTimestamp) => number;
}

export type TimestampType = number | FbTimestamp | object;

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
