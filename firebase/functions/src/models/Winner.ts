import { BoatReference } from "./Boat";
import { HasTimestamp, HasTrophyParent } from "./interfaces";

export interface Winner extends BoatReference, HasTimestamp, HasTrophyParent {
  /** The name of the club. */
  club: string;
  /** The name of the crew. */
  crew: string;
  /** The name of the helm. */
  helm: string;
  /** The name of the boat. */
  name: string;
  /** Any notes about the winner. */
  notes: string;
  /** The sail number of the boat. */
  sail: string;
  /** The name of the boat's owner. */
  owner: string;
  /** The year that the trophy was awarded. */
  year: number;
}
