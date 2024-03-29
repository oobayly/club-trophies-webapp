import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Query, collectionSnapshots, query, where } from "@angular/fire/firestore";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { identifyUsingTimestamp } from "@helpers";
import { Trophy, filterByNormalisedText, getBoatNames } from "@models";
import { BehaviorSubject, Observable, catchError, combineLatest, distinctUntilChanged, map, of, shareReplay, startWith, switchMap, takeUntil } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ClubBaseComponent } from "../club-base-component";

interface TrophyFilter {
  name: FormControl<string>;
  boatName: FormControl<string>
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

  public readonly boats$ = new Observable<string[]>;

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
    auth: Auth,
    db: DbService,
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
      boatName: this.formBuilder.control<string>("", { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private getBoatsObservable(): Observable<string[]> {
    return this.allTrophies$.pipe(
      map((trophies) => {
        return trophies ? getBoatNames(trophies?.map((x) => x.data)) : [];
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

        const collRef = this.db.getTrophyCollection(clubId);
        let q: Query<Trophy>;

        if (canEdit) {
          q = collRef
        } else {
          q = query(collRef, where("public", "==", true));
        }

        return collectionSnapshots(q).pipe(
          map((x) => toRecord(x).sort((a, b) => a.data.name.localeCompare(b.data.name))),
          catchError((err) => {
            console.log(err.code);

            return of(undefined);
          }),
        );
      }),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  private getFilteredTrophiesObservable(): Observable<DbRecord<Trophy>[]> {
    return combineLatest([
      this.filter.valueChanges.pipe(startWith(undefined)),
      this.allTrophies$,
    ]).pipe(
      map(([filter, trophies]) => {
        const boatName = filter?.boatName;
        const name = filter?.name;

        if (!trophies) {
          trophies = [];
        }

        if (boatName === "none") {
          trophies = trophies.filter((x) => x.data.boatName === undefined);
        } else if (boatName) {
          trophies = trophies.filter((x) => x.data.boatName === boatName);
        }
        if (name) {
          trophies = filterByNormalisedText(trophies, name, ["name"], (x) => x.data);
        }

        return trophies;
      }),
    );

  }

  public identifyTrophy = identifyUsingTimestamp;

  // ========================
  // Event handlers
  // ========================

  public async onAddWinnerClick(e: Event, item: DbRecord<Trophy>): Promise<void> {
    e.stopImmediatePropagation();
    e.preventDefault();

    if (!this.clubId) {
      return;
    }

    await this.modal.showEditWinner(this.clubId, item.id);
  }

  public async onEditTrophyClick(e: Event, id: string): Promise<void> {
    e.stopImmediatePropagation();
    e.preventDefault();

    if (!this.clubId) {
      return;
    }

    await this.modal.showEditTrophy(this.clubId, id);
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
      boatName: "",
    });
    this.filter.markAsPristine();
  }
}
