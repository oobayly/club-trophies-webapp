import { Component, HostBinding, Input } from "@angular/core";

@Component({
  selector: "app-tab-page",
  templateUrl: "./tab-page.component.html",
  styleUrls: ["./tab-page.component.scss"],
})
export class TabPageComponent {
  @HostBinding("class") role = "d-contents";

  // ========================
  // Inputs
  // ========================

  @Input()
  public active?: boolean;

  @Input()
  public icon?: string;

  @Input()
  public name?: string;

  @Input()
  public pageBreakBefore = false;
}
