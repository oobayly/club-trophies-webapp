import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, QueryFn } from "@angular/fire/compat/firestore";
import { Club, Collections, Trophy } from "@models";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, filter, map, mergeMap, Observable, of, Subject, switchMap } from "rxjs";
import { truthy } from "src/app/core/helpers";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";

@Component({
  selector: 'app-trophies-list',
  templateUrl: './trophies-list.component.html',
  styleUrls: ['./trophies-list.component.scss']
})
export class TrophiesListComponent implements OnChanges, OnDestroy, OnInit {
  // ========================
  // Properties
  // ========================

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  private readonly onlyPublic$ = new BehaviorSubject(true);

  public readonly trophies$: Observable<DbRecord<Trophy>[] | undefined>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  @Input()
  public onlyPublic: boolean | string | null | undefined;

  // @Input()
  // public trophyId: string | null | undefined;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    this.trophies$ = combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.onlyPublic$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([clubId, onlyPublic]) => {
        if (!clubId) {
          return of(undefined);
        }

        const filter: QueryFn | undefined = onlyPublic ? (ref) => ref.where("public", "==", true) : undefined;

        return this.db
          .collection(Collections.Clubs).doc(clubId)
          .collection<Trophy>(Collections.Trophies, filter)
          .snapshotChanges().pipe(
            map((x) => toRecord(x)),
            catchError((err) => {
              console.log(err.code);

              return of(undefined);
            })
          );
      }),
    )
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
      this.clubId$.next(this.clubId || undefined);
    }
    if ("onlyPublic" in changes) {
      this.onlyPublic$.next(truthy(this.onlyPublic));
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  ngOnInit(): void {
  }

}
