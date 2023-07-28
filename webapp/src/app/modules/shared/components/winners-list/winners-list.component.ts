import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder } from "@angular/forms";
import { Collections, Winner } from "@models";
import { BehaviorSubject, Observable, combineLatest, firstValueFrom, map, of, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { TrophyBaseComponent } from "../trophy-base-component";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ModalService } from "src/app/core/services/modal.service";

interface Column {
  field: keyof Winner;
  title: string;
}

interface ColumnSort {
  field: keyof Winner;
  direction: -1 | 1
}

const Colunms: Column[] = [
  { field: "year", title: "Year" },
  { field: "sail", title: "Sail No." },
  { field: "boatName", title: "Boat Type" },
  { field: "helm", title: "Helm" },
  { field: "crew", title: "Crew" },
  { field: "name", title: "Boat Name" },
  { field: "owner", title: "Owner" },
  { field: "club", title: "Club" },
  { field: "notes", title: "Notes" },
];

interface DbTableRecord<T> extends DbRecord<T> {
  values: any[];
}

@Component({
  selector: "app-winners-list",
  templateUrl: "./winners-list.component.html",
  styleUrls: ["./winners-list.component.scss"],
})
export class WinnersListComponent extends TrophyBaseComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  private readonly allWinners$: Observable<DbRecord<Winner>[]>;

  public readonly canEdit$ = new BehaviorSubject<boolean | undefined>(undefined);

  public readonly sort$ = new BehaviorSubject<ColumnSort>({ field: "year", direction: -1 });

  public readonly sortIcon$ = this.sort$.pipe(map((value) => value.direction === 1 ? "bi-sort-up-alt" : "bi-sort-down"));

  public readonly visibleColumns$: Observable<Column[]>;

  public readonly winners$: Observable<DbTableRecord<Winner>[]>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public canEdit: boolean | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly countChange = new EventEmitter<number>();

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

    this.allWinners$ = this.getAllWinnersObservable();
    this.visibleColumns$ = this.getVisibleColumns();
    this.winners$ = this.getFilteredWinnersObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("canEdit" in changes) {
      this.canEdit$.next(this.canEdit || undefined);
    }
  }

  // ========================
  // Methods
  // ========================

  private getAllWinnersObservable(): Observable<DbRecord<Winner>[]> {
    return combineLatest([
      this.getTrophyRefObservalble().pipe(filterNotNull()),
      this.canEdit$.pipe(filterNotNull()),
    ]).pipe(
      switchMap(([ref, canEdit]) => {
        return ref?.collection<Winner>(Collections.Winners, (ref) => {
          if (canEdit) {
            return ref;
          }

          return ref.where("public", "==", true);
        }).snapshotChanges();
      }),
      map((x) => toRecord(x).sort((a, b) => b.data.year - a.data.year)),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getFilteredWinnersObservable(): Observable<DbTableRecord<Winner>[]> {
    return combineLatest([
      this.visibleColumns$,
      this.allWinners$,
      this.sort$,
      of({}),
    ]).pipe(
      map(([columns, winners, sort, _filter]) => {
        // First do any filtering
        winners = winners.filter((_x) => true);

        // Sort
        winners = WinnersListComponent.sortWinners(winners, sort);

        return winners.map((winner) => {
          const values = columns.map((column) => {
            return winner.data[column.field];
          });

          return {
            ...winner,
            values,
          };
        });
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getVisibleColumns(): Observable<Column[]> {
    return this.allWinners$.pipe(
      map((winners) => {
        return Colunms.filter((column) => winners.some((winner) => !!winner.data[column.field]));
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private static sortWinners(winners: DbRecord<Winner>[], sort: ColumnSort): DbRecord<Winner>[] {
    const { field, direction } = sort;

    return winners.sort((a, b) => {
      const aVal = a.data[field];
      const bVal = b.data[field];
      let compare: number;

      if (aVal === null) {
        compare = -1;
      } else if (bVal === null) {
        compare = 1;
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        compare = aVal - bVal;
      } else {
        compare = `${aVal}`.localeCompare(`${bVal}`);
      }

      return compare * direction;
    });
  }

  // ========================
  // Event handlers
  // ========================

  public async onAddWinnerClick(): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showAddWinner(this.clubId, this.trophyId);
  }

  public onSortHeaderClick(field: keyof Winner): void {
    let sort = { ... this.sort$.value };

    if (sort.field === field) {
      sort.direction = sort.direction === 1 ? -1 : 1;
    } else {
      sort = {
        field,
        direction: field === "year" ? -1 : 1, // Sort ascending, except for year which is latest first
      }
    }

    this.sort$.next(sort);
  }

  public async onWinnerDeleteClick(item: DbRecord<Winner>): Promise<void> {
    const resp = await this.modal.showDelete("Delete Winner", "Are you sure you want to delete this winner?");

    if (!resp) {
      return;
    }

    const ref = await firstValueFrom(this.getTrophyRefObservalble());

    await ref?.collection<Winner>(Collections.Winners).doc(item.id).delete();
  }

  public async onWinnerEditClick(item: DbRecord<Winner>): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showEditWinner(this.clubId, this.trophyId, item.id, item.data);
  }
}
