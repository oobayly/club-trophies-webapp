import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { BoatReference, Collections, Trophy } from "@models";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, startWith, switchMap, takeUntil } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { ModalService } from "src/app/core/services/modal.service";
import { ClubBaseComponent } from "../club-base-component";
import { AngularFireAuth } from "@angular/fire/compat/auth";

interface TrophyFilter {
  name: FormControl<string>;
  boatId: FormControl<string>
}

@Component({
  selector: "app-trophies-list",
  templateUrl: "./trophies-list.component.html",
  styleUrls: ["./trophies-list.component.scss"],
})
export class TrophiesListComponent extends ClubBaseComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  private readonly allTrophies$: Observable<DbRecord<Trophy>[] | undefined>;

  public readonly boats$ = new Observable<BoatReference[]>;

  public readonly canEdit$ = new BehaviorSubject<boolean | undefined>(undefined);

  public readonly filter = this.buildFilterForm();

  public readonly trophies$: Observable<DbRecord<Trophy>[]>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public showFilter: boolean | string | null | undefined = true;

  @Input()
  public canEdit?: boolean;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly trophyClick = new EventEmitter<DbRecord<Trophy>>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: AngularFireAuth,
    db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
    private readonly modal: ModalService,
  ) {
    super(auth, db);

    this.allTrophies$ = this.getTrophiesObservable();
    this.trophies$ = this.getFilteredTrophiesObservable();
    this.boats$ = this.getBoatsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("canEdit" in changes) {
      this.canEdit$.next(this.canEdit);
    }
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

  private getTrophiesObservable(): Observable<DbRecord<Trophy>[] | undefined> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.canEdit$.pipe(distinctUntilChanged(), filterNotNull()), // Wait until we have an actual bool value for canEdit so we don't fetch multiple times when initialising
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
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getFilteredTrophiesObservable(): Observable<DbRecord<Trophy>[]> {
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
          trophies = trophies.filter((x) => !x.data.boatId);
        } else {
          // Match boat
          trophies = trophies.filter((x) => x.data.boatId === boatId);
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

  public async onEditTrophyClick(e: Event, item: DbRecord<Trophy>): Promise<void> {
    e.stopImmediatePropagation();
    e.preventDefault();

    if (!this.clubId) {
      return;
    }

    await this.modal.showEditTrophy(this.clubId, item.id, item.data);
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
