import { Component } from "@angular/core";
import { BaseModalComponent } from "../base-modal.component";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: "app-input-modal",
  templateUrl: "./input-modal.component.html",
  styleUrls: ["./input-modal.component.scss"],
})
export class InputModalComponent extends BaseModalComponent {

  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
