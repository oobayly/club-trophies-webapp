import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Observable, map, mergeMap, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class SignOutResolver implements Resolve<true> {
  constructor(
    private readonly auth: AngularFireAuth,
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
