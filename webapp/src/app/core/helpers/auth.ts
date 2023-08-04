import { IdTokenResult } from "@angular/fire/auth";

export const getRoles = (idToken: IdTokenResult | null | undefined): string[] => {
  return idToken?.claims["roles"] as string[] || [];
}

export const isAdmin = (idToken: IdTokenResult | null | undefined): boolean => {
  return isInRole(idToken, "admin");
}

export const isInRole = (idToken: IdTokenResult | null | undefined, ...roles: string[]): boolean => {
  return getRoles(idToken).some((claimed) => {
    return roles.includes(claimed);
  });
}
