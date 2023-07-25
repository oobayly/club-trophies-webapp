import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { BehaviorSubject, Observable, map, switchMap } from "rxjs";
import { Collections, Trophy } from "@models";
import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { filterNotNull } from "src/app/core/rxjs";
import { DbRecord } from "src/app/core/interfaces/DbRecord";

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

  // private readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  public readonly trophy$: Observable<Trophy | undefined>;

  public readonly winners$ = Observable<DbRecord<Trophy>>;

  // private readonly trophyId$ = new BehaviorSubject<string | undefined>(undefined);

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  @Input()
  public trophyId: string | null | undefined;

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
    );
  }

  // ========================
  // Event handlers
  // ========================
}
