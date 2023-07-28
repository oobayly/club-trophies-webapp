import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";

@Component({
  selector: "app-edit-winner-modal",
  templateUrl: "./edit-winner-modal.component.html",
  styleUrls: ["./edit-winner-modal.component.scss"],
})
export class EditWinnerModalComponent extends BaseModalComponent {
  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
