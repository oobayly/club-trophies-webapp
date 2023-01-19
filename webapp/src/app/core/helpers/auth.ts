export const getRoles = (idToken: firebase.default.auth.IdTokenResult | null | undefined): string[] => {
  return idToken?.claims["roles"] || [];
}

export const hasRole = (idToken: firebase.default.auth.IdTokenResult | null | undefined, ...roles: string[]): boolean => {
  return getRoles(idToken).some((claimed) => {
    return roles.includes(claimed);
  });
}

export const isAdmin = (idToken: firebase.default.auth.IdTokenResult | null | undefined): boolean => {
  return hasRole(idToken, "admin");
}
