import { Component, Input, OnDestroy } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { DocumentReference, docSnapshots } from "@angular/fire/firestore";
import { Club } from "@models";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap, takeUntil } from "rxjs";
import { idToken, isAdmin } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";

@Component({
  template: "",
})
export abstract class ClubBaseComponent implements OnDestroy {
  public abstract readonly canEdit$: Observable<boolean | undefined>;

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  protected readonly destroyed$ = new Subject<void>();

  protected readonly subscriptions: (Subscription | undefined)[] = [];

  @Input()
  public set clubId(value: string | null | undefined) {
    this.clubId$.next(value || undefined);
  }
  public get clubId(): string | null | undefined {
    return this.clubId$.value;
  }

  constructor(
    protected readonly auth: Auth,
    protected readonly db: DbService,
  ) {
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s?.unsubscribe());
    this.destroyed$.next();
  }

  protected getCanEditObservable(club$: Observable<Club | undefined>): Observable<boolean> {
    const user$ = authState(this.auth);

    return combineLatest([
      club$,
      user$,
      user$.pipe(idToken(), isAdmin()),
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

        return docSnapshots(this.db.getClubDoc(clubId));
      }),
      map((x) => x?.data()),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  protected getClubRefObservable(): Observable<DocumentReference<Club> | undefined> {
    return this.clubId$.pipe(
      distinctUntilChanged(),
      map((clubId) => {
        if (!clubId) {
          return undefined;
        }

        return this.db.getClubDoc(clubId);
      }),
    );
  }
}
