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
import { NgbCarouselModule, NgbModalModule } from "@ng-bootstrap/ng-bootstrap";
import { DonatedPipe } from "./pipes/donated.pipe";
import { loadCountries } from "src/app/core/helpers/i18n";
import { EditTrophyModalComponent } from "./modals/edit-trophy-modal/edit-trophy-modal.component";
import { TabContainerComponent } from "./components/tab-container/tab-container.component";
import { TabPageComponent } from "./components/tab-container/tab-page/tab-page.component";
import { WinnersListComponent } from "./components/winners-list/winners-list.component";
import { FilesListComponent } from "./components/files-list/files-list.component";
import { LightboxModalComponent } from "./modals/lightbox-modal/lightbox-modal.component";
import { EditFileModalComponent } from "./modals/edit-file-modal/edit-file-modal.component";
import { EditWinnerModalComponent } from "./modals/edit-winner-modal/edit-winner-modal.component";
import { AlertModalComponent } from "./modals/alert-modal/alert-modal.component";
import { InputModalComponent } from "./modals/input-modal/input-modal.component";
import { NgBtnDirective } from "./directives/ng-btn.directive";
import { TrophyFileEditorComponent } from "./components/trophy-file-editor/trophy-file-editor.component";
import { ToDatePipe } from "./pipes/to-date.pipe";
import { AlertComponent } from "./components/alert/alert.component";
import { TimestampPipe } from "./pipes/timestamp.pipe";

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
    TabContainerComponent,
    TabPageComponent,
    WinnersListComponent,
    FilesListComponent,
    LightboxModalComponent,
    EditFileModalComponent,
    EditWinnerModalComponent,
    AlertModalComponent,
    InputModalComponent,
    NgBtnDirective,
    TrophyFileEditorComponent,
    ToDatePipe,
    AlertComponent,
    TimestampPipe,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbCarouselModule,
    NgbModalModule,
  ],
  exports: [
    AlertComponent,
    ClubEditorComponent,
    ClubInfoComponent,
    ClubsListComponent,
    TrophyEditorComponent,
    TrophyInfoComponent,
    TrophiesListComponent,
    WinnerEditorComponent,
    NgBtnDirective,
    TimestampPipe,
    ToDatePipe,
  ],
})
export class SharedModule {
  constructor() {
    loadCountries();
  }
}
