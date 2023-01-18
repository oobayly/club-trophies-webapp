import { HasTimestamp } from "./interfaces"

/** Creates a new record of the specified type. */
function newRecord<T extends HasTimestamp>(value: Omit<T, "created" | "modified">): T {
  return {
    ...value,
    created: new Date().getTime(),
  } as T;
}

export {
  newRecord,
};
