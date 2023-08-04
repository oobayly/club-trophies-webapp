import { distinctUntilChanged, map, mergeMap, of, OperatorFunction } from "rxjs";
import { getRoles, isInRole, isAdmin } from "../helpers/auth";
import { getIdTokenResult, IdTokenResult, User } from "@angular/fire/auth";

type OptionalIdTokenResult = IdTokenResult | null | undefined;
type OptionalUser = User | null | undefined;

const distinctToken = (p: OptionalIdTokenResult, c: OptionalIdTokenResult): boolean => p?.issuedAtTime === c?.issuedAtTime;

const distinctUidFn = (): OperatorFunction<OptionalUser, string | undefined> => {
  return (source) => {
    return source.pipe(
      map((user) => user?.uid),
      distinctUntilChanged(),
    );
  };
}

const getRolesFn = (): OperatorFunction<OptionalIdTokenResult, string[]> => {
  return (source) => {
    return source.pipe(
      distinctUntilChanged(distinctToken),
      map(getRoles),
    );
  };
}

const idTokenFn = (): OperatorFunction<OptionalUser, OptionalIdTokenResult> => {
  return (source) => {
    return source.pipe(
      mergeMap((user) => user ? getIdTokenResult(user) : of(undefined)),
    )
  };
}

const isAdminFn = (): OperatorFunction<OptionalIdTokenResult, boolean> => {
  return (source) => {
    return source.pipe(
      distinctUntilChanged(distinctToken),
      map(isAdmin),
    );
  };
}

const isInRoleFn = (...roles: string[]): OperatorFunction<OptionalIdTokenResult, boolean> => {
  return (source) => {
    return source.pipe(
      distinctUntilChanged(distinctToken),
      map((token) => isInRole(token, ...roles)),
    );
  };
}

export {
  distinctUidFn as distinctUid,
  getRolesFn as getRoles,
  idTokenFn as idToken,
  isAdminFn as isAdmin,
  isInRoleFn as isInRole,
}
