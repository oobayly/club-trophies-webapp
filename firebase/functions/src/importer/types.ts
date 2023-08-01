export interface LegacyHasTimestamp {
  fldCreated: Date | string;
  fldModified: Date | string;
}

export interface LegacyClass extends LegacyHasTimestamp {
  fldClassID: number;
  fldName: string;
  clubId?: string;
}

export interface LegacyTrophy extends LegacyHasTimestamp {
  fldTrophyID: number;
  fldName: string;
  fldDonor: string;
  fldYearDonated: string | number;
  fldCurrentClassID: number;
  fldConditions: string;
  fldDetails: string;
  fldRedBookPage: string | number;
}

export interface LegacyWinner extends LegacyHasTimestamp {
  fldWinnerID: number;
  fldTrophyID: number;
  fldClassID: number;
  fldYear: number;
  fldHelm: string;
  fldCrew: string;
  fldSailNumber: string;
  fldNotes: string;
  fldOwner: string;
}
