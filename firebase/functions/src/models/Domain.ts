import { HasTimestamp } from "./interfaces";

export interface Domain extends HasTimestamp {
  /** The short name of the club. */
  country: string;
  /** The hostname. */
  hostname: string;
  /** The name of the club. */
  name: string;
  /** The short name of the club. */
  shortName: string;
}
