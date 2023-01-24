import { Component, importProvidersFrom, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, DocumentChangeAction, DocumentData, QueryFn } from "@angular/fire/compat/firestore";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, distinctUntilKeyChanged, EMPTY, finalize, map, mergeMap, NEVER, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { Club, ClubBurgeeRequest, Collections } from "@models";
import { distinctUid } from "src/app/core/rxjs/auth";
import { CollectionReference, Query } from "firebase/firestore";

export type ViewMode = "all" | "mine" | "public";

@Component({
  selector: 'app-clubs-list',
  templateUrl: './clubs-list.component.html',
  styleUrls: ['./clubs-list.component.scss']
})
export class ClubsListComponent implements OnChanges, OnDestroy, OnInit {
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
  public mode?: ViewMode;

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore
  ) {
    this.clubs$ = this.getClubsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("mode" in changes) {
      this.mode$.next(this.mode);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  ngOnInit(): void {
  }

  private getClubsObservable(): Observable<DbRecord<Club>[]> {
    return combineLatest([
      this.uid$,
      this.mode$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([uid, mode]) => {
        let filter: QueryFn;

        if (mode === "all" && uid) {
          filter = (ref) => ref;
        } else if (mode === "mine" && uid) {
          filter = (ref) => ref.where("admins", "array-contains", uid);
        } else if (mode === "public") {
          filter = (ref) => ref.where("public", "==", true);
        } else {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs, filter).snapshotChanges().pipe(
          catchError((err) => {
            console.log("Got an error: " + err.code);

            return of(undefined);
          })
        );
      }),
      takeUntil(this.destroyed$),
      map((x) => x ? toRecord(x) : []),
      finalize(() => console.log("Finalized")),
      shareReplay(),
    )
  }
}
