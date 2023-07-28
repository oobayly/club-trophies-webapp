import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";
import { TrophyFile } from "@models";

@Component({
  selector: "app-edit-file-modal",
  templateUrl: "./edit-file-modal.component.html",
  styleUrls: ["./edit-file-modal.component.scss"],
})
export class EditFileModalComponent extends BaseModalComponent<string> {
  public clubId!: string;

  public fileId!: string;

  public file!: TrophyFile;

  public trophyId!: string;

  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
