export const getRoles = (idToken: firebase.default.auth.IdTokenResult | null | undefined): string[] => {
  return idToken?.claims["roles"] || [];
}

export const isAdmin = (idToken: firebase.default.auth.IdTokenResult | null | undefined): boolean => {
  return isInRole(idToken, "admin");
}

export const isInRole = (idToken: firebase.default.auth.IdTokenResult | null | undefined, ...roles: string[]): boolean => {
  return getRoles(idToken).some((claimed) => {
    return roles.includes(claimed);
  });
}
