import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { isInRole } from "../helpers/auth";

export const authGuardForRole = (...roles: string[]) => {
  return {
    requiredRoles: roles
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AngularFireAuth,
    private router: Router,
  ) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const { url } = state;
    const requiredRoles = route.data["requiredRoles"] as string[] || [];
    const token = await firstValueFrom(this.auth.idTokenResult);

    if (!token) {
      return this.router.createUrlTree(["/auth", "sign-in"], {
        queryParams: {
          redirectTo: url
        }
      });
    }

    const isValid = isInRole(token, ...requiredRoles);

    if (!isValid) {
      console.log(`${token.claims["sub"]} does not have permission to load route ${url}`);
    }

    return isValid;
  }
}
