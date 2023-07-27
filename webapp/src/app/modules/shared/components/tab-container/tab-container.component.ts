import { AfterViewInit, Component, ContentChildren, EventEmitter, Input, OnChanges, Output, QueryList, SimpleChanges } from "@angular/core";
import { TabPageComponent } from "./tab-page/tab-page.component";

@Component({
  selector: "app-tab-container",
  templateUrl: "./tab-container.component.html",
  styleUrls: ["./tab-container.component.scss"],
})
export class TabContainerComponent implements AfterViewInit, OnChanges {
  // ========================
  // Content
  // ========================

  @ContentChildren(TabPageComponent)
  public tabPages?: QueryList<TabPageComponent>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public tabIndex: number | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly tabIndexChange = new EventEmitter<number>();

  // ========================
  // Lifecycle
  // ========================

  constructor() { }

  ngAfterViewInit(): void {
    // Wait for the queue to complete
    window.setTimeout(() => {
      const active = this.tabPages?.find((x) => !!x.active);

      if (active) {
        this.setSelected(active);
      } else if (this.tabIndex && this.tabPages?.get(this.tabIndex)) {
        this.setSelected(this.tabIndex);
      } else if (this.tabPages?.length) {
        this.setSelected(0);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("selectedIndex" in changes) {
      const { tabIndex: selectedIndex } = this;

      if (typeof selectedIndex === "number") {
        this.setSelected(selectedIndex, true);
      }
    }
  }

  // ========================
  // Methods
  // ========================

  public setSelected(index: number, suppressChange?: boolean): void;
  public setSelected(item: TabPageComponent, suppressChange?: boolean): void;
  public setSelected(value: number | TabPageComponent, suppressChange = false): void {
    let selected: number | undefined;

    if (typeof value === "number") {
      this.tabPages?.forEach((item, i) => {
        item.active = value === i;

        if (item.active) {
          selected = i;
        }
      });
    } else {
      this.tabPages?.forEach((item, i) => {
        item.active = item === value;

        if (item.active) {
          selected = i;
        }
      });
    }

    if (selected !== undefined && !suppressChange) {
      this.tabIndexChange.next(selected);
    }
  }
}
