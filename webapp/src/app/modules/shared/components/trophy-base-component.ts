import { Component, Input } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { ClubBaseComponent } from "./club-base-component";
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map } from "rxjs";
import { Collections, Trophy } from "@models";
import { DbService } from "src/app/core/services/db.service";

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
    auth: AngularFireAuth,
    db: DbService,
  ) {
    super(auth, db);
  }

  protected getTrophyRefObservalble(): Observable<AngularFirestoreDocument<Trophy> | undefined> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.trophyId$.pipe(distinctUntilChanged()),
    ]).pipe(
      map(([clubId, trophyId]) => {
        if (!clubId || !trophyId) {
          return undefined;
        }

        return this.db.firestore.collection(Collections.Clubs).doc(clubId).collection<Trophy>(Collections.Trophies).doc(trophyId);
      }),
    );
  }
}
