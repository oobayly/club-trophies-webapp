import { Injectable } from "@angular/core";
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Club, Collections, Trophy } from "@models";
import { catchError, map, Observable, of } from "rxjs";
import { DbService } from "../services/db.service";

@Injectable({
  providedIn: "root",
})
export class TrophyNameResolver implements Resolve<string> {
  constructor(
    private readonly db: DbService,
  ) { }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<string> {
    const clubId = route.paramMap.get("clubId");
    const trophyId = route.paramMap.get("trophyId");

    if (!clubId || !trophyId) {
      return of("");
    }

    return this.db.firestore
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
