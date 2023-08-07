import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { Query, collectionSnapshots, query, where } from "@angular/fire/firestore";
import { identifyUsingTimestamp } from "@helpers";
import { Club } from "@models";
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, distinctUntilChanged, map, of, shareReplay, switchMap, takeUntil } from "rxjs";
import { CanEditDbRecord, DbRecord, toCanEditRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { distinctUid, idToken, isAdmin } from "src/app/core/rxjs/auth";
import { DbService } from "src/app/core/services/db.service";
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
    private readonly auth: Auth,
    private readonly db: DbService,
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
    const user$ = authState(this.auth);
    const uid$ = user$.pipe(distinctUid());
    const clubs$ = combineLatest([
      uid$,
      this.mode$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([uid, mode]) => {
        const collRef = this.db.getClubsCollection();
        let q: Query<Club>;

        if (mode === "all" && uid) {
          q = collRef;
        } else if (mode === "mine" && uid) {
          q = query(collRef, where("admins", "array-contains", uid));
        } else if (mode === "public") {
          q = query(collRef, where("public", "==", true));
        } else {
          return of(undefined);
        }

        return collectionSnapshots(q).pipe(
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
      user$.pipe(idToken(), isAdmin()),
    ]).pipe(
      map(([clubs, uid, isAdmin]) => toCanEditRecord(clubs, uid, isAdmin)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  public identifyClub = identifyUsingTimestamp;

  // ========================
  // Event handlers
  // ========================

  public async onEditClubClick(e: Event, id: string): Promise<void> {
    e.preventDefault();
    e.stopPropagation();

    await this.modal.showEditClub(id);
  }

  public onItemClick(e: Event, item: DbRecord<Club>): void {
    if (this.clubClick.observed) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }

    this.clubClick.next(item);
  }
}
