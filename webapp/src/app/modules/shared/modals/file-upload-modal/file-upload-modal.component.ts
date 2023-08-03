import { Component } from "@angular/core";
import { BaseModalComponent } from "../base-modal.component";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { UploadMode } from "../../components/file-upload/file-upload.component";

@Component({
  selector: "app-file-upload-modal",
  templateUrl: "./file-upload-modal.component.html",
  styleUrls: ["./file-upload-modal.component.scss"],
})
export class FileUploadModalComponent extends BaseModalComponent<string | string[]> {
  public clubId!: string;

  public files?: FileList | File[];

  public mode: UploadMode = "trophy-file";

  public trophyId?: string;

  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
