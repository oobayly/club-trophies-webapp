import { Component, Input } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { DocumentReference } from "@angular/fire/firestore";
import { Trophy } from "@models";
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map } from "rxjs";
import { DbService } from "src/app/core/services/db.service";
import { ClubBaseComponent } from "./club-base-component";

@Component({
  template: "",
})
export abstract class TrophyBaseComponent extends ClubBaseComponent {
  public readonly trophyId$ = new BehaviorSubject<string | undefined>(undefined);

  @Input()
  public set trophyId(value: string | null | undefined) {
    this.trophyId$.next(value || undefined);
  }
  public get trophyId(): string | null | undefined {
    return this.trophyId$.value;
  }

  constructor(
    auth: Auth,
    db: DbService,
  ) {
    super(auth, db);
  }

  protected getTrophyRefObservable(): Observable<DocumentReference<Trophy> | undefined> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.trophyId$.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([clubId, trophyId]) => {
        if (!clubId || !trophyId) {
          return undefined;
        }

        return this.db.getTrophyDoc(clubId, trophyId);
      }),
    );
  }
}
