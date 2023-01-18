import { HasTimestamp } from "./interfaces";

export interface Domain extends HasTimestamp {
  /** The hostname. */
  hostname: string;
  /** The name of the club. */
  name: string;
}
