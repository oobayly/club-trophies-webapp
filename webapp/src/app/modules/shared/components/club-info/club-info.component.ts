import { Component, EventEmitter, Output } from "@angular/core";
import { Observable, tap } from "rxjs";
import { Club } from "@models";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ModalService } from "src/app/core/services/modal.service";
import { ClubBaseComponent } from "../club-base-component";
import { DbService } from "src/app/core/services/db.service";

@Component({
  selector: "app-club-info",
  templateUrl: "./club-info.component.html",
  styleUrls: ["./club-info.component.scss"],
})
export class ClubInfoComponent extends ClubBaseComponent {
  // ========================
  // Properties
  // ========================

  public readonly canEdit$: Observable<boolean>;

  public readonly club$: Observable<Club | undefined>;

  // ========================
  // Inputs
  // ========================

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly canEditChange = new EventEmitter<boolean>();

  @Output()
  public readonly clubChange = new EventEmitter<Club | undefined>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: AngularFireAuth,
    db: DbService,
    private readonly modal2: ModalService,
  ) {
    super(auth, db);
    this.club$ = this.getClubObservable().pipe(
      tap((club) => this.clubChange.next(club)),
    );
    this.canEdit$ = this.getCanEditObservable(this.club$).pipe(
      tap((canEdit) => this.canEditChange.next(canEdit)),
    );
  }

  // ========================
  // Methods
  // ========================

  // ========================
  // Event handlers
  // ========================

  public onUploadClick(): void {
  }

  public async onEditClick(club: Club): Promise<void> {
    if (!this.clubId) {
      return;
    }

    await this.modal2.showEditClub(this.clubId, club);
  }
}
