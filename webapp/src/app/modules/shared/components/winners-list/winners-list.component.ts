import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Collections, Winner } from "@models";
import { BehaviorSubject, Observable, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { TrophyBaseComponent } from "../trophy-base-component";
import { DbService } from "src/app/core/services/db.service";
import { filterNotNull } from "src/app/core/rxjs";
import { QueryDocumentSnapshot, collection, collectionSnapshots } from "@angular/fire/firestore";
import { Auth } from "@angular/fire/auth";

@Component({
  selector: "app-winners-list",
  templateUrl: "./winners-list.component.html",
  styleUrls: ["./winners-list.component.scss"],
})
export class WinnersListComponent extends TrophyBaseComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

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

    this.winners$ = this.getWinnersObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("canEdit" in changes) {
      this.canEdit$.next(this.canEdit || undefined);
    }
  }

  // ========================
  // Methods
  // ========================

  private getWinnersObservable(): Observable<DbRecord<Winner>[]> {
    return this.getTrophyRefObservable().pipe(
      filterNotNull(),
      switchMap((ref) => collectionSnapshots(collection(ref, Collections.Winners))),
      map((x) => toRecord(x) as DbRecord<Winner>[]), // Because angular fire doesn't do generics anymore
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }
  // ========================
  // Event handlers
  // ========================
}
