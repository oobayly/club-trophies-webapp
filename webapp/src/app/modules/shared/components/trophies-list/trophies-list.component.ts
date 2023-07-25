import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { AngularFirestore, Query, QueryFn } from "@angular/fire/compat/firestore";
import { BoatReference, Collections, Trophy } from "@models";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";
import { truthy } from "src/app/core/helpers";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";

@Component({
  selector: "app-trophies-list",
  templateUrl: "./trophies-list.component.html",
  styleUrls: ["./trophies-list.component.scss"],
})
export class TrophiesListComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly boats$ = new Observable<BoatReference[]>;

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  private readonly onlyPublic$ = new BehaviorSubject(true);

  public readonly trophies$ = this.getTrophiesObservable();

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  @Input()
  public onlyPublic: boolean | string | null | undefined;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private db: AngularFirestore,
  ) {
    this.boats$ = this.getBoatsObservable();
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

  // ========================
  // Methods
  // ========================

  private getBoatsObservable(): Observable<BoatReference[]> {
    return this.trophies$.pipe(
      map((trophies) => {
        const list: BoatReference[] = [
          { boatId: "all", boatName: "All boats" },
          { boatId: "none", boatName: "No boat" },
        ];

        return (trophies || [])?.reduce((accum, item) => {
          if ("boatId" in item.data) {
            const { boatId, boatName } = item.data as BoatReference;

            if (!accum.some((x) => x.boatId === boatId)) {
              accum.push({ boatId, boatName });
            }
          }

          return accum;
        }, list);
      }),
    );
  }

  private getTrophiesObservable(): Observable<DbRecord<Trophy>[] | undefined> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.onlyPublic$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([clubId, onlyPublic]) => {
        if (!clubId) {
          return of(undefined);
        }

        const filter: QueryFn | undefined = onlyPublic
          ? (ref): Query => ref.where("public", "==", true)
          : undefined
          ;

        return this.db
          .collection(Collections.Clubs).doc(clubId)
          .collection<Trophy>(Collections.Trophies, filter)
          .snapshotChanges().pipe(
            map((x) => toRecord(x).sort((a, b) => a.data.name.localeCompare(b.data.name))),
            catchError((err) => {
              console.log(err.code);

              return of(undefined);
            }),
          );
      }),
      shareReplay(1),
      takeUntil(this.destroyed$),
    );
  }
}
