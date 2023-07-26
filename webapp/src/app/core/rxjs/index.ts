import { OperatorFunction, filter } from "rxjs";

export * from "./auth";
// export * from "./firestore";

export const filterNotNull = <T>(): OperatorFunction<T, Exclude<T, null | undefined>> => {
  return filter((value: T): value is Exclude<T, null | undefined> => value != null);
}
