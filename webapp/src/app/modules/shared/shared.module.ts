import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { NgbCarouselModule, NgbModalModule } from "@ng-bootstrap/ng-bootstrap";
import { ImageCropperModule } from "ngx-image-cropper";
import { loadCountries } from "src/app/core/helpers/i18n";
import { AlertComponent } from "./components/alert/alert.component";
import { ClubEditorComponent } from "./components/club-editor/club-editor.component";
import { ClubInfoComponent } from "./components/club-info/club-info.component";
import { ClubsListComponent } from "./components/clubs-list/clubs-list.component";
import { FileUploadComponent } from "./components/file-upload/file-upload.component";
import { FilesListComponent } from "./components/files-list/files-list.component";
import { LoaderComponent } from "./components/loader/loader.component";
import { SearchResultComponent } from "./components/search-result/search-result.component";
import { TabContainerComponent } from "./components/tab-container/tab-container.component";
import { TabPageComponent } from "./components/tab-container/tab-page/tab-page.component";
import { TrophiesListComponent } from "./components/trophies-list/trophies-list.component";
import { TrophyEditorComponent } from "./components/trophy-editor/trophy-editor.component";
import { TrophyFileEditorComponent } from "./components/trophy-file-editor/trophy-file-editor.component";
import { TrophyInfoComponent } from "./components/trophy-info/trophy-info.component";
import { WinnerEditorComponent } from "./components/winner-editor/winner-editor.component";
import { WinnerFilterComponent } from "./components/winner-filter/winner-filter.component";
import { WinnerTableComponent } from "./components/winner-table/winner-table.component";
import { WinnersListComponent } from "./components/winners-list/winners-list.component";
import { ClubLogoDirective } from "./directives/club-logo.directive";
import { NgBtnDirective } from "./directives/ng-btn.directive";
import { BoatSelectComponent } from "./forms/boat-select/boat-select.component";
import { AlertModalComponent } from "./modals/alert-modal/alert-modal.component";
import { EditClubModalComponent } from "./modals/edit-club-modal/edit-club-modal.component";
import { EditFileModalComponent } from "./modals/edit-file-modal/edit-file-modal.component";
import { EditTrophyModalComponent } from "./modals/edit-trophy-modal/edit-trophy-modal.component";
import { EditWinnerModalComponent } from "./modals/edit-winner-modal/edit-winner-modal.component";
import { FileUploadModalComponent } from "./modals/file-upload-modal/file-upload-modal.component";
import { InputModalComponent } from "./modals/input-modal/input-modal.component";
import { LightboxModalComponent } from "./modals/lightbox-modal/lightbox-modal.component";
import { DonatedPipe } from "./pipes/donated.pipe";
import { FlagPipe } from "./pipes/flag.pipe";
import { TimestampPipe } from "./pipes/timestamp.pipe";
import { ToDatePipe } from "./pipes/to-date.pipe";

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
    BoatSelectComponent,
    SearchResultComponent,
    WinnerTableComponent,
    LoaderComponent,
    FlagPipe,
    FileUploadModalComponent,
    FileUploadComponent,
    ClubLogoDirective,
    WinnerFilterComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    NgbCarouselModule,
    NgbModalModule,
    ImageCropperModule,
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
    SearchResultComponent,
    WinnerFilterComponent,
    LoaderComponent,
    ClubLogoDirective,
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
