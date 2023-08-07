import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { AbstractControl, ControlValueAccessor, FormBuilder, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from "@angular/forms";
import { uuid } from "@helpers";
import { Boat } from "@models";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, distinctUntilChanged, map, of, switchMap } from "rxjs";
import { DbRecord } from "src/app/core/interfaces/DbRecord";
import { DbService } from "src/app/core/services/db.service";

export type BoatListType = "all" | "mine-only" | "mine-and-public";

interface BoatsGroup {
  all: DbRecord<Boat>[];
  mine: DbRecord<Boat>[];
  others: DbRecord<Boat>[];
}

@Component({
  selector: "app-boat-select",
  templateUrl: "./boat-select.component.html",
  styleUrls: ["./boat-select.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: BoatSelectComponent,
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: BoatSelectComponent,
    },
  ],
})
export class BoatSelectComponent implements OnChanges, OnDestroy, ControlValueAccessor, Validator {
  // ========================
  // Properties
  // ========================

  public readonly boats$: Observable<BoatsGroup>;

  private readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  public readonly form = this.formBuilder.control<string>("");

  public readonly formId = uuid();

  private readonly subscriptions: (Subscription)[] = [];

  public readonly type$ = new BehaviorSubject<BoatListType>("mine-and-public");

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId!: string;

  @Input()
  public label = "Class";

  @Input()
  public type: BoatListType = "mine-and-public";

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly db: DbService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.boats$ = this.getBoatsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
      this.clubId$.next(this.clubId);
    }

    if ("type" in changes) {
      this.type$.next(this.type);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ========================
  // Methods
  // ========================

  private getBoatsObservable(): Observable<BoatsGroup> {
    return combineLatest([
      this.clubId$.pipe(distinctUntilChanged()),
      this.type$.pipe(distinctUntilChanged()),
    ]).pipe(
      switchMap(([clubId, type]) => {
        let all: Observable<DbRecord<Boat>[]> | undefined;
        let mine: Observable<DbRecord<Boat>[]> | undefined;
        let others: Observable<DbRecord<Boat>[]> | undefined;

        if (type === "all") {
          all = this.db.getAllBoats();
        } else if (type === "mine-and-public" || type === "mine-only") {
          mine = clubId ? this.db.getBoats(clubId) : undefined;
          others = type === "mine-and-public" ? this.db.getBoats() : undefined;
        }

        return combineLatest([
          all || of([]),
          mine || of([]),
          others || of([]),
        ]);
      }),
      map(([all, mine, others]) => {
        return { all, mine, others };
      }),
    );
  }

  // ========================
  // Forms
  // ========================

  validate(_control: AbstractControl<any, any>): ValidationErrors | null {
    return this.form.errors;
  }

  // registerOnValidatorChange?(fn: () => void): void {
  //   throw new Error("Method not implemented.");
  // }

  writeValue(value: string | null): void {
    this.form.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.subscriptions.push(this.form.valueChanges.subscribe(fn));
  }

  registerOnTouched(fn: Function): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.form.disable();
    }
    else {
      this.form.enable();
    }
  }

  // ========================
  // Event handlers
  // ========================

  onTouched: Function = () => { };
}
