import { Injectable } from "@angular/core";
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from "@angular/router";
import { DbService, typedCollection } from "../services/db.service";
import { Collections, Domain } from "@models";
import { getDocs, query, where } from "@angular/fire/firestore";

@Injectable({
  providedIn: "root",
})
export class ClubIdResolver implements Resolve<string | void> {
  constructor(
    private readonly db: DbService,
    private readonly router: Router,
  ) { }

  async resolve(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Promise<string | void> {
    const country = route.paramMap.get("country")?.toLocaleUpperCase() || "";
    const shortName = route.paramMap.get("shortName")?.toLocaleUpperCase() || "";
    const domains = await getDocs(
      query(
        typedCollection<Domain>(this.db.firestore, Collections.Domains),
        where("country", "==", country),
        where("shortName", "==", shortName),
      ),
    );

    const clubId = domains.docs[0]?.id;

    if (clubId) {
      return clubId;
    }

    await this.router.navigateByUrl("/");

    return undefined;
  }
}
