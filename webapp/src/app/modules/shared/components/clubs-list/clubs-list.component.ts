import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, Query, QueryFn } from "@angular/fire/compat/firestore";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { Club, Collections } from "@models";
import { distinctUid } from "src/app/core/rxjs/auth";

export type ViewMode = "all" | "mine" | "public";

@Component({
  selector: "app-clubs-list",
  templateUrl: "./clubs-list.component.html",
  styleUrls: ["./clubs-list.component.scss"],
})
export class ClubsListComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly clubs$: Observable<DbRecord<Club>[]>;

  private readonly destroyed$ = new Subject<void>();

  public readonly uid$ = this.auth.user.pipe(distinctUid());

  private readonly mode$ = new BehaviorSubject<ViewMode | undefined>(undefined);

  // ========================
  // Inputs
  // ========================

  @Input()
  public mode: ViewMode | null | undefined;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    this.clubs$ = this.getClubsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("mode" in changes) {
      this.mode$.next(this.mode || undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  private getClubsObservable(): Observable<DbRecord<Club>[]> {
    return combineLatest([
      this.uid$,
      this.mode$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([uid, mode]) => {
        let filter: QueryFn;

        if (mode === "all" && uid) {
          filter = (ref): Query => ref;
        } else if (mode === "mine" && uid) {
          filter = (ref): Query => ref.where("admins", "array-contains", uid);
        } else if (mode === "public") {
          filter = (ref): Query => ref.where("public", "==", true);
        } else {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs, filter).snapshotChanges().pipe(
          catchError((err) => {
            console.log("Got an error: " + err.code);

            return of(undefined);
          }),
        );
      }),
      takeUntil(this.destroyed$),
      map((x) => x ? toRecord(x) : []),
      shareReplay(),
    )
  }
}
