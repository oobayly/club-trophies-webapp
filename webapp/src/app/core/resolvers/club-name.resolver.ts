import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Club, Collections } from "@models";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ClubNameResolver implements Resolve<string> {
  constructor(
    private readonly db: AngularFirestore,
  ) { }

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<string> {
    const clubId = route.paramMap.get("clubId");

    if (!clubId) {
      return of("");
    }

    return this.db.collection<Club>(Collections.Clubs).doc(clubId).snapshotChanges().pipe(
      catchError(() => {
        return of(undefined);
      }),
      map((doc) => doc?.payload.data()?.name || ""),
    );
  }
}
