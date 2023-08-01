import { v4 } from "uuid";
import { HasTimestamp, TimestampType } from "@models";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { DbRecord } from "../interfaces/DbRecord";

export const truthy = (value: any): boolean => {
  if (typeof value === "string" && value.toLocaleLowerCase() === "false") {
    return false;
  }

  return !!value;
}

export const compareTimestamps = (a: TimestampType | null, b: TimestampType | null): number => {
  if (a === null) {
    return -1;
  } else if (b === null) {
    return 1;
  }

  if ("toMillis" in a && "toMillis" in b) {
    return a.toMillis() - b.toMillis();
  }

  return 0;
}

export const createdTimestamp = (): HasTimestamp => {
  return {
    created: firebase.firestore.FieldValue.serverTimestamp(),
    modified: null,
  };
}

function identifyUsingTimestamp(_index: number, item: DbRecord<HasTimestamp>): string;
function identifyUsingTimestamp(_index: number, item: HasTimestamp, id?: string): string
function identifyUsingTimestamp(_index: number, item: DbRecord<HasTimestamp> | HasTimestamp, id?: string): string {
  let ts: HasTimestamp;
  if ("data" in item) {
    ts = item.data;
    id = item.id;
  } else {
    ts = item;
  }

  const timestamp = ts.modified || ts.created;
  const millis = "toMillis" in timestamp ? timestamp.toMillis() : 0; // ms is good enough resolution to identify if the record has changed

  return `${id}${millis}`;
}

export const modifiedTimestamp = (): Pick<HasTimestamp, "modified"> => {
  return { modified: firebase.firestore.FieldValue.serverTimestamp() };
}

export const uuid = (): string => v4();

export {
  identifyUsingTimestamp,
}
