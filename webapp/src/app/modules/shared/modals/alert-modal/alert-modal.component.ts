import { Component } from "@angular/core";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";
import { NgButton, NgButtonColor } from "../../directives/ng-btn.directive";

export interface AlertButton<T = string | boolean | number> extends NgButton {
  text: string;
  icon?: string;
  value?: T;
}

@Component({
  selector: "app-alert-modal",
  templateUrl: "./alert-modal.component.html",
  styleUrls: ["./alert-modal.component.scss"],
})
export class AlertModalComponent<T = NgButtonColor> extends BaseModalComponent<T> {
  // ========================
  // Properties
  // ========================

  public icon?: string;

  public message?: string;

  public title?: string;

  public buttons?: AlertButton<T>[];

  // ========================
  // Properties
  // ========================

  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }

  public onButtonClick(value: T | undefined): void {
    if (value === undefined) {
      this.dismiss();
    } else {
      this.close(value);
    }
  }
}
