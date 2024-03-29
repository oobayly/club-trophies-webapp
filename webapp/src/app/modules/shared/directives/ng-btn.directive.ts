import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from "@angular/core";
import { NgColor } from "@helpers/angular";

export interface NgButton {
  color: NgColor;
  outline?: boolean;
}

@Directive({
  selector: "[appNgBtn]",
})
export class NgBtnDirective implements OnChanges {
  private _class?: string;

  @Input()
  public appNgBtn?: NgColor | NgButton;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
  ) { }
  ngOnChanges(changes: SimpleChanges): void {
    if ("appNgBtn" in changes) {
      this.updateClass();
    }
  }

  private updateClass(): void {
    let value = this.appNgBtn;

    if (this._class) {
      this.el.nativeElement.classList.remove(this._class);
    }

    if (!value) {
      this._class = undefined;

      return;
    }

    if (typeof value === "string") {
      value = {
        color: value,
      };
    }

    const className = "btn" + (value.outline ? "-outline" : "") + `-${value.color}`;

    this.el.nativeElement.classList.add(className);
    this._class = className;
  }
}
