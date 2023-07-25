import { Component } from "@angular/core";
import { BaseModalComponent } from "../base-modal.component";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { Club } from "@models";

@Component({
  selector: "app-edit-club-modal",
  templateUrl: "./edit-club-modal.component.html",
  styleUrls: ["./edit-club-modal.component.scss"],
})
export class EditClubModalComponent extends BaseModalComponent<string> {
  public clubId: string | undefined;

  public club?: Club

  public constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
