import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, map, mergeMap, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SignOutResolver implements Resolve<true> {
  constructor(
    private readonly auth: Auth,
    private readonly router: Router,
  ) { }

  resolve(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<true> {
    return of(this.auth.signOut()).pipe(
      mergeMap(() => {
        return this.router.navigate(["/"]);
      }),
      map(() => true),
    )
  }
}
