import { Component, Input } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { ClubBaseComponent } from "./club-base-component";
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map } from "rxjs";
import { Collections, Trophy } from "@models";

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
    db: AngularFirestore,
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

        return this.db.collection(Collections.Clubs).doc(clubId).collection<Trophy>(Collections.Trophies).doc(trophyId);
      }),
    );
  }
}
