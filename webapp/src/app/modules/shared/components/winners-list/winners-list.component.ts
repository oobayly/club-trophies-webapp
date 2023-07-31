import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Collections, Winner } from "@models";
import { BehaviorSubject, Observable, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { TrophyBaseComponent } from "../trophy-base-component";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ModalService } from "src/app/core/services/modal.service";
import { DbService } from "src/app/core/services/db.service";
import { filterNotNull } from "src/app/core/rxjs";

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
  public boatRef?: string | null;

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
    db: DbService,
    private readonly formBuilder: FormBuilder,
    private readonly modal: ModalService,
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
    return this.getTrophyRefObservalble().pipe(
      filterNotNull(),
      switchMap((ref) => ref.collection<Winner>(Collections.Winners).snapshotChanges()),
      map((x) => toRecord(x)),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }
  // ========================
  // Event handlers
  // ========================

  public async onAddWinnerClick(): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showAddWinner(this.clubId, this.trophyId, this.boatRef || undefined);
  }
}
