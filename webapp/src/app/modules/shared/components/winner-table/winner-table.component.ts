import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { identifyUsingTimestamp } from "@helpers";
import { SearchResult, Winner } from "@models";
import { BehaviorSubject, Observable, Subject, combineLatest, map, of, shareReplay, takeUntil } from "rxjs";
import { DbRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";
import { ModalService } from "src/app/core/services/modal.service";

type Field = keyof Pick<Winner | SearchResult, "year" | "sail" | "boatName" | "helm" | "crew" | "name" | "owner" | "club">;

interface Column {
  field: Field;
  title: string;
}

interface ColumnSort {
  field: Field;
  direction: -1 | 1
}

const Colunms: Column[] = [
  { field: "year", title: "Year" },
  { field: "sail", title: "Sail No." },
  { field: "boatName", title: "Class" },
  { field: "helm", title: "Helm" },
  { field: "crew", title: "Crew" },
  { field: "name", title: "Boat Name" },
  { field: "owner", title: "Owner" },
  { field: "club", title: "Club" },
];

type ItemWrapper = { values: any[] } & ({ data: Winner, id: string } | { data: SearchResult, id?: undefined });

// interface ItemWrapper {
//   data: Winner | SearchResult;
//   values: any[];
//   id?: string;
// }

@Component({
  selector: "app-winner-table",
  templateUrl: "./winner-table.component.html",
  styleUrls: ["./winner-table.component.scss"],
})
export class WinnerTableComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly canEdit$ = new BehaviorSubject<boolean | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  public readonly results$: Observable<ItemWrapper[]>;

  public readonly sort$ = new BehaviorSubject<ColumnSort>({ field: "year", direction: -1 });

  public readonly sortIcon$ = this.sort$.pipe(map((value) => value.direction === 1 ? "bi-sort-up-alt" : "bi-sort-down"));

  private readonly values$ = new BehaviorSubject<ItemWrapper[] | undefined>(undefined);

  public readonly visibleColumns$: Observable<Column[]>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public canEdit: boolean | null | undefined;

  @Input()
  public values?: DbRecord<Winner>[] | SearchResult[];

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly countChange = new EventEmitter<number>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly db: DbService,
    private readonly modal: ModalService,
  ) {
    this.visibleColumns$ = this.getVisibleColumns();
    this.results$ = this.getFilteredItemsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("values" in changes) {
      this.updateValues();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  // ========================
  // Methods
  // ========================

  private getFilteredItemsObservable(): Observable<ItemWrapper[]> {
    return combineLatest([
      this.visibleColumns$,
      this.values$.pipe(filterNotNull()),
      this.sort$,
      of({}),
    ]).pipe(
      map(([columns, items, sort, _filter]) => {
        // First do any filtering
        items = items.filter((_x) => true);

        // Sort
        items = WinnerTableComponent.sortValues(items, sort);

        items.forEach((item) => {
          item.values = columns.map((column) => item.data[column.field]);
        })

        return items;
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getVisibleColumns(): Observable<Column[]> {
    return this.values$.pipe(
      filterNotNull(),
      map((items) => {
        return Colunms.filter((column) => items.some((item) => !!item.data[column.field]));
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  public identifyWinner(_index: number, item: ItemWrapper): string | ItemWrapper {
    if (item.id) {
      return identifyUsingTimestamp(_index, item.data, item.id);
    }

    return item;
  }

  private static sortValues(items: ItemWrapper[], sort: ColumnSort): ItemWrapper[] {
    const { field, direction } = sort;

    return items.sort((a, b) => {
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

  private updateValues(): void {
    const { values } = this;

    if (!values) {
      this.values$.next(undefined);

      return;
    } else if (!values.length) {
      this.values$.next([]);

      return;
    }

    let items: ItemWrapper[];

    // Rather than checking each record, check the first, and use a cast
    if ("data" in values[0]) {
      items = (values as DbRecord<Winner>[]).map((x): ItemWrapper => {
        return {
          data: x.data,
          id: x.id,
          values: [],
        };
      });
    } else {
      items = (values as SearchResult[]).map((x): ItemWrapper => {
        return {
          data: x,
          values: [],
        };
      });
    }

    this.values$.next(items);
  }

  // ========================
  // Event handlers
  // ========================

  public onSortHeaderClick(field: Field): void {
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

  public async onItemDeleteClick(item: ItemWrapper): Promise<void> {
    if (!item.id) {
      return;
    }

    const resp = await this.modal.showDelete("Delete Winner", `Are you sure you want to delete this winner for ${item.data.year}?`);

    if (!resp) {
      return;
    }

    const { clubId, trophyId } = item.data.parent;
    const ref = this.db.getWinnerDoc(clubId, trophyId, item.id);

    await ref.delete();
  }

  public async onItemEditClick(item: ItemWrapper): Promise<void> {
    const { clubId, trophyId } = item.data.parent;

    if (!item.id) {
      return;
    }

    await this.modal.showEditWinner(clubId, trophyId, item.id, item.data as Winner);
  }
}
