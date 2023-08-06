import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Subscription, debounceTime } from "rxjs";

export interface WinnerFilter {
  sail?: string;
  text?: string;
  boatName?: string;
}

type FormValues<T> = {
  [K in keyof T]-?: FormControl<T[K]>;
}

@Component({
  selector: "app-winner-filter",
  templateUrl: "./winner-filter.component.html",
  styleUrls: ["./winner-filter.component.scss"],
})
export class WinnerFilterComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly form = this.buildForm();

  private readonly subscriptions: Subscription[] = [];

  // ========================
  // Inputs
  // ========================

  @Input()
  public boatNames?: string[] | null;

  @Input()
  public set filter(value: WinnerFilter | null | undefined) {
    this.form.patchValue({
      sail: value?.sail || "",
      boatName: value?.boatName || "",
      text: value?.text || "",
    });
  }

  @Input()
  public showBoatName = true;

  @Input()
  public showSail = true;

  @Input()
  public showText = true;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly filterChange = new EventEmitter<WinnerFilter>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly formBuilder: FormBuilder,
  ) {
    this.subscriptions.push(this.form.valueChanges.pipe(debounceTime(100)).subscribe((filter) => {
      this.filterChange.next(filter);
    }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("filter" in changes) {
      this.form.patchValue(
        this.filter || {},
        { emitEvent: false },
      );
    }
    if ("showBoatName" in changes) {
      this.enableControl("boatName", this.showBoatName);
    }
    if ("showSail" in changes) {
      this.enableControl("sail", this.showSail);
    }
    if ("showText" in changes) {
      this.enableControl("text", this.showText);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ========================
  // Methods
  // ========================

  private buildForm(): FormGroup<FormValues<WinnerFilter>> {
    return this.formBuilder.group<FormValues<WinnerFilter>>({
      sail: this.formBuilder.control<string>("", { nonNullable: true }),
      text: this.formBuilder.control<string>("", { nonNullable: true }),
      boatName: this.formBuilder.control<string>("", { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private enableControl(name: keyof WinnerFilter, enabled: boolean): void {
    const ctl = this.form.get(name);

    if (enabled) {
      ctl?.enable();
    } else {
      ctl?.disable();
    }
  }

  // ========================
  // Event handlers
  // ========================

  public onResetFilterClick(): void {
    this.filter = {};
    this.form.markAsPristine();
  }
}
