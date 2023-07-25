import { OperatorFunction, filter } from "rxjs";

export * from "./auth";
// export * from "./firestore";

export const filterNotNull = <T>(): OperatorFunction<T, NonNullable<T>> => {
  return filter((value: T): value is NonNullable<T> => !!value);
}
