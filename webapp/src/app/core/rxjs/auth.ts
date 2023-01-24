import { distinctUntilChanged, map, OperatorFunction } from "rxjs";
import { getRoles, hasRole, isAdmin } from "../helpers/auth";

type OptionalIdTokenResult = firebase.default.auth.IdTokenResult | null | undefined;
type OptionalUser = firebase.default.User | null | undefined;

const distinctToken = (p: OptionalIdTokenResult, c: OptionalIdTokenResult) => p?.issuedAtTime === c?.issuedAtTime;

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
      map(getRoles)
    );
  };
}

const isAdminFn = (): OperatorFunction<OptionalIdTokenResult, boolean> => {
  return (source) => {
    return source.pipe(
      distinctUntilChanged(distinctToken),
      map(isAdmin)
    );
  };
}

const isInRoleFn = (...roles: string[]): OperatorFunction<OptionalIdTokenResult, boolean> => {
  return (source) => {
    return source.pipe(
      distinctUntilChanged(distinctToken),
      map((token) => hasRole(token, ...roles))
    );
  };
}

export {
  distinctUidFn as distinctUid,
  getRolesFn as getRoles,
  isAdminFn as isAdmin,
  isInRoleFn as isInRole,
}
