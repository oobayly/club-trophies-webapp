import { Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from "@angular/router";
import { Club, Collections } from "@models";
import { Observable, catchError, map, of } from "rxjs";
import { DbService } from "../services/db.service";

@Injectable({
  providedIn: "root",
})
export class ClubNameResolver implements Resolve<string> {
  constructor(
    private readonly db: DbService,
  ) { }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<string> {
    const clubId = route.paramMap.get("clubId");

    if (!clubId) {
      return of("");
    }

    return this.db.firestore.collection<Club>(Collections.Clubs).doc(clubId).snapshotChanges().pipe(
      catchError(() => {
        return of(undefined);
      }),
      map((doc) => doc?.payload.data()?.name || ""),
    );
  }
}
