import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, Query, QueryFn } from "@angular/fire/compat/firestore";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";
import { CanEditDbRecord, DbRecord, toCanEditRecord, toRecord } from "src/app/core/interfaces/DbRecord";
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

  public readonly clubs$: Observable<CanEditDbRecord<Club>[]>;

  private readonly destroyed$ = new Subject<void>();

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

  private getClubsObservable(): Observable<CanEditDbRecord<Club>[]> {
    const uid$ = this.auth.user.pipe(distinctUid());
    const clubs$ = combineLatest([
      uid$,
      this.mode$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([uid, mode]) => {
        let query: QueryFn;

        if (mode === "all" && uid) {
          query = (ref): Query => ref;
        } else if (mode === "mine" && uid) {
          query = (ref): Query => ref.where("admins", "array-contains", uid);
        } else if (mode === "public") {
          query = (ref): Query => ref.where("public", "==", true);
        } else {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs, query).snapshotChanges().pipe(
          catchError((err) => {
            console.log("Got an error: " + err.code);

            return of(undefined);
          }),
        );
      }),
      map((snapshot) => snapshot ? toRecord(snapshot) : []),
    );

    return combineLatest([
      clubs$,
      uid$,
    ]).pipe(
      map(([clubs, uid]) => toCanEditRecord(clubs, uid)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
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
