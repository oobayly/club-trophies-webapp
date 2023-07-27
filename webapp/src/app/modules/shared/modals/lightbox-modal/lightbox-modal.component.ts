import { Component, HostBinding, ViewChild } from "@angular/core";
import { TrophyFile } from "@models";
import { BaseModalComponent } from "../base-modal.component";
import { NgbActiveModal, NgbCarousel } from "@ng-bootstrap/ng-bootstrap";
import { DbRecord } from "src/app/core/interfaces/DbRecord";

@Component({
  selector: "app-lightbox-modal",
  templateUrl: "./lightbox-modal.component.html",
  styleUrls: ["./lightbox-modal.component.scss"],
})
export class LightboxModalComponent extends BaseModalComponent<void>{
  @HostBinding("class") role = "d-contents";

  public selectedId = "";

  public photos?: DbRecord<TrophyFile>[];

  @ViewChild("carousel")
  private readonly carousel?: NgbCarousel;

  public constructor(
    activeModal: NgbActiveModal,
  ) {
    super(activeModal);
  }
}
