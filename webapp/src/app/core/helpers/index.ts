import { v4 } from "uuid";
import { HasTimestamp } from "@models";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

export const truthy = (value: any): boolean => {
  if (typeof value === "string" && value.toLocaleLowerCase() === "false") {
    return false;
  }

  return !!value;
}

export const createdTimestamp = (): HasTimestamp => {
  return {
    created: firebase.firestore.FieldValue.serverTimestamp(),
    modified: null,
  };
}

export const modifiedTimestamp = (): Pick<HasTimestamp, "modified"> => {
  return { modified: firebase.firestore.FieldValue.serverTimestamp() };
}

export const uuid = (): string => v4();
