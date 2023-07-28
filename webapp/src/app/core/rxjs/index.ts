import { OperatorFunction, filter } from "rxjs";

export * from "./auth";

export const filterNotNull = <T>(): OperatorFunction<T, Exclude<T, null | undefined>> => {
  return filter((value: T): value is Exclude<T, null | undefined> => value != null);
}
