import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { isInRole } from "../helpers/auth";
import { Auth, authState, getIdTokenResult } from "@angular/fire/auth";
import { firstValueFrom } from "rxjs";

export interface AuthGuardData {
  requiredRoles: string[];
}

export const authGuardForRole = (...roles: string[]): AuthGuardData => {
  return {
    requiredRoles: roles,
  }
};

@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: Auth,
    private router: Router,
  ) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const { url } = state;
    const requiredRoles = route.data["requiredRoles"] as string[] || [];
    const user = await firstValueFrom(authState(this.auth));
    const token = user ? await getIdTokenResult(user) : undefined;

    if (!token) {
      return this.router.createUrlTree(["/auth", "sign-in"], {
        queryParams: {
          redirectTo: url,
        },
      });
    }

    const isValid = !requiredRoles.length || isInRole(token, ...requiredRoles);

    if (!isValid) {
      console.log(`${token.claims["sub"]} does not have permission to load route ${url}`);
    }

    return isValid;
  }
}
