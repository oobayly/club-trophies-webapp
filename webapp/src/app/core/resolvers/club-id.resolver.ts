import { Injectable } from "@angular/core";
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { Observable, mergeMap } from "rxjs";
import { DbService } from "../services/db.service";
import { Collections, Domain } from "@models";

@Injectable({
  providedIn: "root",
})
export class ClubIdResolver implements Resolve<string | void> {
  constructor(
    private readonly db: DbService,
    private readonly router: Router,
  ) { }

  resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<string | void> {
    const country = route.paramMap.get("country")?.toUpperCase() || "";
    const shortName = route.paramMap.get("shortName")?.toUpperCase() || "";

    const snapshot = this.db.firestore.collection<Domain>(Collections.Domains, (ref) => {
      return ref.where("country", "==", country).where("shortName", "==", shortName);
    }).get();

    return snapshot.pipe(
      mergeMap(async (docs) => {
        const clubId = docs.docs[0]?.id;

        if (clubId) {
          return clubId;
        }

        await this.router.navigateByUrl("/");

        return undefined;
      }),
    );
  }
}
