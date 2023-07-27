import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder } from "@angular/forms";
import { Collections, Winner } from "@models";
import { BehaviorSubject, Observable, combineLatest, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { TrophyBaseComponent } from "../trophy-base-component";
import { AngularFireAuth } from "@angular/fire/compat/auth";

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

  public readonly winners$: Observable<DbRecord<Winner>[]>;

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
  ) {
    super(auth, db);

    this.allWinners$ = this.getAllWinnersObservable();
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
      map((x) => toRecord(x)),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getFilteredWinnersObservable(): Observable<DbRecord<Winner>[]> {
    return this.allWinners$.pipe();
  }

  // ========================
  // Event handlers
  // ========================
}
