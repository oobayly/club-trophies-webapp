import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { Club, Trophy } from "@models";
import { filterNotNull } from "src/app/core/rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { TrophyBaseComponent } from "../trophy-base-component";
import { ModalService } from "src/app/core/services/modal.service";
import { DbService } from "src/app/core/services/db.service";

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

  public readonly boatRef$: Observable<string | undefined>;

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
    auth: AngularFireAuth,
    db: DbService,
    private readonly modal: ModalService,
  ) {
    super(auth, db);

    const club = this.getClubObservable().pipe(
      tap((club) => this.clubChange.next(club)),
    );

    this.canEdit$ = this.getCanEditObservable(club).pipe(
      takeUntil(this.destroyed$),
      shareReplay(),
    );
    this.trophy$ = this.getTrophyObservable();
    this.boatRef$ = this.trophy$.pipe(map((trophy) => trophy?.boatRef?.path));
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
    return this.getTrophyRefObservalble().pipe(
      filterNotNull(),
      switchMap((ref) => ref.snapshotChanges()),
      map((snapshot) => snapshot.payload.data()),
      tap((item) => this.trophyChange.next(item)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  // ========================
  // Event handlers
  // ========================

  public async onEditTrophyClick(trophy: Trophy): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showEditTrophy(this.clubId, this.trophyId, trophy);
  }
}
