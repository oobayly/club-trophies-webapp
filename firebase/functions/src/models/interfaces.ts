export interface HasPublic {
  /** A flag indicating whether the record is public. */
  public: boolean;
}

export interface HasTimestamp {
  /** The timestamp of when the record was created. */
  created: number;
  /** The timestamp of when the record was last modified. */
  modified?: number;
}

export interface UploadInfo {
  /** The signed URL to be used for uploading the file. */
  url: string;
  /** The headers to use when uploading the file. */
  headers: { [key: string]: string };
}
