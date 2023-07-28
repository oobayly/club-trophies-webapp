import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder } from "@angular/forms";
import { Collections, Winner } from "@models";
import { BehaviorSubject, Observable, combineLatest, map, of, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { TrophyBaseComponent } from "../trophy-base-component";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ModalService } from "src/app/core/services/modal.service";

interface Column {
  field: keyof Winner,
  title: string;
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
      of({}),
    ]).pipe(
      map(([columns, winners, _filter]) => {
        // First do any filtering
        winners = winners.filter((_x) => true);

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

  // ========================
  // Event handlers
  // ========================

  public async onWinnerEditClick(item: DbRecord<Winner>): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showEditWinner(this.clubId, this.trophyId, item.id, item.data);
  }
}
