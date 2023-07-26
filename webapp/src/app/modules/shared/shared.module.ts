import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ClubsListComponent } from "./components/clubs-list/clubs-list.component";
import { TrophiesListComponent } from "./components/trophies-list/trophies-list.component";
import { RouterModule } from "@angular/router";
import { ClubInfoComponent } from "./components/club-info/club-info.component";
import { ClubEditorComponent } from "./components/club-editor/club-editor.component";
import { TrophyInfoComponent } from "./components/trophy-info/trophy-info.component";
import { TrophyEditorComponent } from "./components/trophy-editor/trophy-editor.component";
import { WinnerEditorComponent } from "./components/winner-editor/winner-editor.component";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { EditClubModalComponent } from "./modals/edit-club-modal/edit-club-modal.component";
import { NgbModalModule } from "@ng-bootstrap/ng-bootstrap";
import { DonatedPipe } from "./pipes/donated.pipe";
import { loadCountries } from "src/app/core/helpers/i18n";
import { EditTrophyModalComponent } from './modals/edit-trophy-modal/edit-trophy-modal.component';

@NgModule({
  declarations: [
    ClubEditorComponent,
    ClubInfoComponent,
    ClubsListComponent,
    TrophyEditorComponent,
    TrophyInfoComponent,
    TrophiesListComponent,
    WinnerEditorComponent,
    EditClubModalComponent,
    DonatedPipe,
    EditTrophyModalComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
  ],
  exports: [
    ClubEditorComponent,
    ClubInfoComponent,
    ClubsListComponent,
    TrophyEditorComponent,
    TrophyInfoComponent,
    TrophiesListComponent,
    WinnerEditorComponent,
  ],
})
export class SharedModule {
  constructor() {
    loadCountries();
  }
}
