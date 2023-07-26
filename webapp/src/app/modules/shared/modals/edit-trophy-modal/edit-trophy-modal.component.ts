import { Component } from "@angular/core";
import { Trophy } from "@models";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { BaseModalComponent } from "../base-modal.component";

@Component({
  selector: "app-edit-trophy-modal",
  templateUrl: "./edit-trophy-modal.component.html",
  styleUrls: ["./edit-trophy-modal.component.scss"],
})
export class EditTrophyModalComponent extends BaseModalComponent<string> {
  public clubId!: string;

  public trophyId?: string;

  public trophy?: Trophy

  public constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
