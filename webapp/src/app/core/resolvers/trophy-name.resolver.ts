import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Club, Collections, Trophy } from "@models";
import { catchError, map, Observable, of } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class TrophyNameResolver implements Resolve<string> {
  constructor(
    private readonly db: AngularFirestore,
  ) { }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<string> {
    const clubId = route.paramMap.get("clubId");
    const trophyId = route.paramMap.get("trophyId");

    if (!clubId || !trophyId) {
      return of("");
    }

    return this.db
      .collection<Club>(Collections.Clubs).doc(clubId)
      .collection<Trophy>(Collections.Trophies).doc(trophyId)
      .snapshotChanges().pipe(
        catchError(() => {
          return of(undefined);
        }),
        map((doc) => doc?.payload.data()?.name || ""),
      );
  }
}
