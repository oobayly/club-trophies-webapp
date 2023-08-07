import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";

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
