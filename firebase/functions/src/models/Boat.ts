import { DocumentRefLike, HasTimestamp } from "./interfaces";

export interface Boat extends HasTimestamp {
  /** A flag indicating whether the boat has been archived. */
  archived: boolean;
  /** The name of the boat (class). */
  name: string;
}

export interface BoatReference {
  /** The ID of the current boat for which the record is associated. */
  boatRef?: DocumentRefLike;
  /** The name of the current boat for which the record is associated. */
  boatName?: string;
}
