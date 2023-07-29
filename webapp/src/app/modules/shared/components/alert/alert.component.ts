import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { getIconForColor, NgColor } from "@helpers/angular";
import { BehaviorSubject } from "rxjs";

@Component({
  selector: "app-alert",
  templateUrl: "./alert.component.html",
  styleUrls: ["./alert.component.scss"],
})
export class AlertComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  public readonly icon$: BehaviorSubject<string | undefined>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public canClose = false;

  @Input()
  public color: NgColor = "info";

  @Input()
  public isHidden = false;

  @Input()
  public icon: string | false | null | undefined;

  @Input()
  public title: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly hidden = new EventEmitter<void>();

  // ========================
  // Lifecycle
  // ========================

  constructor() {
    this.icon$ = new BehaviorSubject<string | undefined>(this.getIcon());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("icon" in changes || "color" in changes) {
      this.icon$.next(this.getIcon());
    }
  }

  // ========================
  // Methods
  // ========================

  private getIcon(): string | undefined {
    let { icon } = this;

    if (icon === false) {
      icon = undefined;
    } else if (!icon) {
      icon = getIconForColor(this.color);
    }

    return icon;
  }

  // ========================
  // Event handlers
  // ========================

  public onCloseClick(): void {
    this.isHidden = true;
    this.hidden.next();
  }
}
