import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { BehaviorSubject, Observable, map, switchMap, tap } from "rxjs";
import { Collections, Trophy } from "@models";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { filterNotNull } from "src/app/core/rxjs";
import { DbRecord } from "src/app/core/interfaces/DbRecord";

export type TabType = "winners" | "info" | "photos";

const TabPages: TabType[] = ["winners", "info", "photos"];

@Component({
  selector: "app-trophy-info",
  templateUrl: "./trophy-info.component.html",
  styleUrls: ["./trophy-info.component.scss"],
})
export class TrophyInfoComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  private readonly ref$ = new BehaviorSubject<AngularFirestoreDocument<Trophy> | undefined>(undefined);

  public tabIndex = 0;

  public readonly trophy$: Observable<Trophy | undefined>;

  public readonly winners$ = Observable<DbRecord<Trophy>>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  @Input()
  public tab: TabType | null | undefined = "info";

  @Input()
  public trophyId: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly trophyChange = new EventEmitter<Trophy | undefined>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly db: AngularFirestore,
  ) {
    this.trophy$ = this.getTrophyObservable();
    // this.winners$ = this.getWinnersObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes || "trophyId" in changes) {
      const { clubId, trophyId } = this;

      if (clubId && trophyId) {
        const ref = this.db.collection(Collections.Clubs).doc(clubId).collection<Trophy>(Collections.Trophies).doc(trophyId);

        this.ref$.next(ref);
      } else {
        this.ref$.next(undefined);
      }
    }

    if ("tab" in changes) {
      const index = this.tab ? TabPages.indexOf(this.tab) : -1;

      if (index !== -1) {
        this.tabIndex = index;
      }
    }
  }

  // ========================
  // Methods
  // ========================

  private getTrophyObservable(): Observable<Trophy | undefined> {
    return this.ref$.pipe(
      filterNotNull(),
      switchMap((ref) => ref.snapshotChanges()),
      map((snapshot) => {
        return snapshot.payload.data();
      }),
      tap((item) => this.trophyChange.next(item)),
    );
  }

  // ========================
  // Event handlers
  // ========================
}
