import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { Query, collection, collectionSnapshots, query, where } from "@angular/fire/firestore";
import { Collections, Winner, filterByNormalisedText, getBoatNames } from "@models";
import { BehaviorSubject, Observable, combineLatest, filter, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { DbService } from "src/app/core/services/db.service";
import { TrophyBaseComponent } from "../trophy-base-component";
import { WinnerFilter } from "../winner-filter/winner-filter.component";

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

  public readonly boatNames$: Observable<string[]>;

  public readonly filter$ = new BehaviorSubject<WinnerFilter>({});

  public readonly winners$: Observable<DbRecord<Winner>[]>;

  public readonly canEdit$ = new BehaviorSubject<boolean | undefined>(undefined);

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
    auth: Auth,
    db: DbService,
  ) {
    super(auth, db);

    this.allWinners$ = this.getWinnersObservable();
    this.boatNames$ = this.getBoatNames();
    this.winners$ = this.getFilteredWinnersObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("canEdit" in changes) {
      this.canEdit$.next(this.canEdit === null ? undefined : this.canEdit);
    }
  }

  // ========================
  // Methods
  // ========================

  private getBoatNames(): Observable<string[]> {
    return this.allWinners$.pipe(
      map((winners) => getBoatNames(winners.map((x) => x.data))),
    )
  }

  private getFilteredWinnersObservable(): Observable<DbRecord<Winner>[]> {
    const normalizedFilter$ = this.filter$.pipe(
      map((x): WinnerFilter => {
        return {
          boatName: x.boatName,
          sail: x.sail?.toLocaleUpperCase(),
          text: x.text?.toLocaleUpperCase(),
        }
      }),
    );

    return combineLatest([
      this.allWinners$,
      normalizedFilter$,
    ]).pipe(
      map(([winners, filter]) => {
        const { boatName, sail, text } = filter;

        if (boatName) {
          winners = winners.filter((x) => x.data.boatName === boatName);
        }
        // TODO: Implement this
        if (sail) {
          winners = filterByNormalisedText(winners, sail, ["sail"], (x) => x.data);
        }
        if (text) {
          winners = filterByNormalisedText(winners, text, ["club", "crew", "helm", "name", "owner"], (x) => x.data);
        }

        return winners;
      }),
    );
  }

  private getWinnersObservable(): Observable<DbRecord<Winner>[]> {
    return combineLatest([
      this.getTrophyRefObservable(),
      this.canEdit$,
    ]).pipe(
      filter(([ref, canEdit]) => !!ref && canEdit !== undefined),
      switchMap(([ref, canEdit]) => {
        let q = collection(ref!, Collections.Winners) as Query<Winner>;

        if (!canEdit) {
          q = query(q, where("suppress", "==", false));
        }

        return collectionSnapshots(q);
      }),
      map((x) => toRecord(x)),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  // ========================
  // Event handlers
  // ========================
}
