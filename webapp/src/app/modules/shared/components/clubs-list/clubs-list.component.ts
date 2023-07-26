import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, Query, QueryFn } from "@angular/fire/compat/firestore";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { Club, Collections } from "@models";
import { distinctUid } from "src/app/core/rxjs/auth";
import { ModalService } from "src/app/core/services/modal.service";

export type ViewMode = "all" | "mine" | "public";

@Component({
  selector: "app-clubs-list",
  templateUrl: "./clubs-list.component.html",
  styleUrls: ["./clubs-list.component.scss"],
})
export class ClubsListComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly clubs$: Observable<DbRecord<Club>[]>;

  private readonly destroyed$ = new Subject<void>();

  public readonly uid$ = this.auth.user.pipe(distinctUid());

  private readonly mode$ = new BehaviorSubject<ViewMode | undefined>(undefined);

  // ========================
  // Inputs
  // ========================

  @Input()
  public mode: ViewMode | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly clubClick = new EventEmitter<DbRecord<Club>>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly db: AngularFirestore,
    private readonly modal: ModalService,
  ) {
    this.clubs$ = this.getClubsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("mode" in changes) {
      this.mode$.next(this.mode || undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  // ========================
  // Methods
  // ========================

  private getClubsObservable(): Observable<DbRecord<Club>[]> {
    return combineLatest([
      this.uid$,
      this.mode$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([uid, mode]) => {
        let filter: QueryFn;

        if (mode === "all" && uid) {
          filter = (ref): Query => ref;
        } else if (mode === "mine" && uid) {
          filter = (ref): Query => ref.where("admins", "array-contains", uid);
        } else if (mode === "public") {
          filter = (ref): Query => ref.where("public", "==", true);
        } else {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs, filter).snapshotChanges().pipe(
          catchError((err) => {
            console.log("Got an error: " + err.code);

            return of(undefined);
          }),
        );
      }),
      takeUntil(this.destroyed$),
      map((x) => x ? toRecord(x) : []),
      shareReplay(),
    )
  }

  // ========================
  // Event handlers
  // ========================

  public async onEditClubClick(e: Event, record: DbRecord<Club>): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    await this.modal.showEditClub(record.id, record.data);
  }

  public onItemClick(e: Event, item: DbRecord<Club>): void {
    if (this.clubClick.observed) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    this.clubClick.next(item);
  }
}
