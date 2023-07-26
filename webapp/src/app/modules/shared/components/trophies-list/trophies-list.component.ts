import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { AnyTrophy, BoatReference, Collections, Trophy } from "@models";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, startWith, Subject, switchMap, takeUntil } from "rxjs";
import { truthy } from "src/app/core/helpers";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";

interface TrophyFilter {
  name: FormControl<string>;
  boatId: FormControl<string>
}

@Component({
  selector: "app-trophies-list",
  templateUrl: "./trophies-list.component.html",
  styleUrls: ["./trophies-list.component.scss"],
})
export class TrophiesListComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  private readonly allTrophies$: Observable<DbRecord<AnyTrophy>[] | undefined>;

  public readonly boats$ = new Observable<BoatReference[]>;

  private readonly canEdit$ = new BehaviorSubject(false);

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  public readonly filter = this.buildFilterForm();

  public readonly trophies$: Observable<DbRecord<AnyTrophy>[]>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public showFilter: boolean | string | null | undefined = true;

  @Input()
  public canEdit: boolean | string | null | undefined = false;

  @Input()
  public clubId: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly trophyClick = new EventEmitter<DbRecord<Trophy>>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
  ) {
    this.allTrophies$ = this.getTrophiesObservable();
    this.trophies$ = this.getFilteredTrophiesObservable();
    this.boats$ = this.getBoatsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
      this.clubId$.next(this.clubId || undefined);
    }
    if ("canEdit" in changes) {
      this.canEdit$.next(truthy(this.canEdit));
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  // ========================
  // Methods
  // ========================

  private buildFilterForm(): FormGroup<TrophyFilter> {
    return this.formBuilder.group<TrophyFilter>({
      name: this.formBuilder.control<string>("", { nonNullable: true }),
      boatId: this.formBuilder.control<string>("all", { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private getBoatsObservable(): Observable<BoatReference[]> {
    return this.allTrophies$.pipe(
      map((trophies) => {
        return (trophies || [])?.reduce((accum, item) => {
          if ("boatId" in item.data) {
            const { boatId, boatName } = item.data as BoatReference;

            if (!accum.some((x) => x.boatId === boatId)) {
              accum.push({ boatId, boatName });
            }
          }

          return accum;
        }, [] as BoatReference[]);
      }),
    );
  }

  private getTrophiesObservable(): Observable<DbRecord<AnyTrophy>[] | undefined> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.canEdit$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([clubId, canEdit]) => {
        if (!clubId) {
          return of(undefined);
        }

        const ref = this.db
          .collection(Collections.Clubs).doc(clubId)
          .collection<Trophy>(Collections.Trophies, (ref) => {
            if (!canEdit) {
              return ref.where("public", "==", true);
            }

            return ref;
          });

        return ref.snapshotChanges().pipe(
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

  private getFilteredTrophiesObservable(): Observable<DbRecord<AnyTrophy>[]> {
    return combineLatest([
      this.filter.valueChanges.pipe(startWith(undefined)),
      this.allTrophies$,
    ]).pipe(
      map(([filter, trophies]) => {
        const boatId = filter?.boatId || "all";
        const name = filter?.name?.trim()?.toUpperCase();

        if (!trophies) {
          trophies = [];
        }

        if (boatId === "all") {
          // Do nothing
        } else if (boatId === "none") {
          // Without boat
          trophies = trophies.filter((x) => !("boatId" in x.data));
        } else {
          // Match boat
          trophies = trophies.filter((x) => "boatId" in x.data && x.data.boatId === boatId);
        }

        if (name) {
          trophies = trophies.filter((x) => {
            return x.data.name.toUpperCase().includes(name);
          });
        }

        return trophies;
      }),
    );

  }

  // ========================
  // Event handlers
  // ========================

  public onEditTrophyClick(e: Event, item: DbRecord<Trophy>): void {
    e.stopImmediatePropagation();
    e.preventDefault();

  }

  public onItemClick(e: Event, item: DbRecord<Trophy>): void {
    if (this.trophyClick.observed) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    this.trophyClick.next(item);
  }

  public onResetFilterClick(): void {
    this.filter.setValue({
      name: "",
      boatId: "all",
    });
  }
}
