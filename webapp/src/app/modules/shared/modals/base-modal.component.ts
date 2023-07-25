import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";

export abstract class BaseModalComponent<T = unknown> {
  constructor(
    protected readonly activeModal: NgbActiveModal,
  ) { }

  protected dismiss(): void {
    this.activeModal.dismiss();
  }

  protected close(result: T): void {
    this.activeModal.close(result);
  }
}
