import { Component } from "@angular/core";
import { Club } from "@models";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";

@Component({
  selector: "app-edit-club-modal",
  templateUrl: "./edit-club-modal.component.html",
  styleUrls: ["./edit-club-modal.component.scss"],
})
export class EditClubModalComponent extends BaseModalComponent<string> {
  public clubId?: string;

  public club?: Club

  public constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
