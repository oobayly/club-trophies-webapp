import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { Club, Trophy } from "@models";
import { filterNotNull } from "src/app/core/rxjs";
import { TrophyBaseComponent } from "../trophy-base-component";
import { DbService } from "src/app/core/services/db.service";
import { docSnapshots } from "@angular/fire/firestore";
import { Auth } from "@angular/fire/auth";

export type TabType = "winners" | "info" | "photos";

const TabPages: TabType[] = ["info", "winners", "photos"];

@Component({
  selector: "app-trophy-info",
  templateUrl: "./trophy-info.component.html",
  styleUrls: ["./trophy-info.component.scss"],
})
export class TrophyInfoComponent extends TrophyBaseComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  public override canEdit$: Observable<boolean | undefined>;

  public tabIndex = 0;

  public readonly trophy$: Observable<Trophy | undefined>;

  public files = 0;

  public winners = 0;

  // ========================
  // Inputs
  // ========================

  @Input()
  public tab: TabType | null | undefined = "info";

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly clubChange = new EventEmitter<Club | undefined>();

  @Output()
  public readonly trophyChange = new EventEmitter<Trophy | undefined>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: Auth,
    db: DbService,
  ) {
    super(auth, db);

    const club = this.getClubObservable().pipe(
      tap((club) => this.clubChange.next(club)),
    );

    this.canEdit$ = this.getCanEditObservable(club).pipe(
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
    this.trophy$ = this.getTrophyObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
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
    return this.getTrophyRefObservable().pipe(
      filterNotNull(),
      switchMap((ref) => docSnapshots(ref)),
      map((snapshot) => snapshot.data()),
      tap((item) => this.trophyChange.next(item)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  // ========================
  // Event handlers
  // ========================
}
