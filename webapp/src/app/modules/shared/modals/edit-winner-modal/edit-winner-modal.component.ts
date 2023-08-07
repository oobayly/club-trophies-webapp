import { Component } from "@angular/core";
import { Winner } from "@models";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";

@Component({
  selector: "app-edit-winner-modal",
  templateUrl: "./edit-winner-modal.component.html",
  styleUrls: ["./edit-winner-modal.component.scss"],
})
export class EditWinnerModalComponent extends BaseModalComponent<string> {
  public boatRef?: string;

  public clubId!: string;

  public trophyId!: string;

  public winner?: Winner;

  public winnerId?: string;

  constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
