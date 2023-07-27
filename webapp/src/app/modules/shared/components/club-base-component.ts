import { Component, Input, OnDestroy } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { Club, Collections } from "@models";
import { BehaviorSubject, Observable, Subject, combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap, takeUntil } from "rxjs";
import { isAdmin } from "src/app/core/rxjs";

@Component({
  template: "",
})
export abstract class ClubBaseComponent implements OnDestroy {
  public abstract readonly canEdit$: Observable<boolean | undefined>;

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  protected readonly destroyed$ = new Subject<void>();

  @Input()
  public set clubId(value: string | null | undefined) {
    this.clubId$.next(value || undefined);
  }
  public get clubId(): string | null | undefined {
    return this.clubId$.value;
  }

  constructor(
    protected readonly auth: AngularFireAuth,
    protected readonly db: AngularFirestore,
  ) {
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  protected getCanEditObservable(club: Observable<Club | undefined>): Observable<boolean> {
    return combineLatest([
      club,
      this.auth.user,
      this.auth.idTokenResult.pipe(isAdmin()),
    ]).pipe(
      map(([club, user, isAdmin]) => {
        if (!club || !user) {
          return false;
        }

        if (isAdmin) {
          return true;
        }

        return club.admins.includes(user.uid);
      }),
    );
  }

  protected getClubObservable(): Observable<Club | undefined> {
    return this.clubId$.pipe(
      distinctUntilChanged(),
      switchMap((clubId) => {
        if (!clubId) {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs).doc(clubId).snapshotChanges();
      }),
      map((x) => x?.payload.data()),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  protected getClubRefObservalble(): Observable<AngularFirestoreDocument<Club> | undefined> {
    return this.clubId$.pipe(
      distinctUntilChanged(),
      map((clubId) => {
        if (!clubId) {
          return undefined;
        }

        return this.db.collection<Club>(Collections.Clubs).doc(clubId);
      }),
    );
  }
}
