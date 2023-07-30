import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, shareReplay, switchMap, takeUntil } from "rxjs";
import { Boat, Trophy } from "@models"
import { DbRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { uuid } from "src/app/core/helpers";
import { DbService } from "src/app/core/services/db.service";

interface TrophyFormData {
  conditions: FormControl<string>;
  details: FormControl<string>;
  donated: FormControl<string>;
  donor: FormControl<string>;
  name: FormControl<string>;
  page: FormControl<string>;
  boatRef: FormControl<string | null>;
  public: FormControl<boolean>;
}

@Component({
  selector: "app-trophy-editor",
  templateUrl: "./trophy-editor.component.html",
  styleUrls: ["./trophy-editor.component.scss"],
})
export class TrophyEditorComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly boats$: Observable<DbRecord<Boat>[]>;

  private readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  public readonly form = this.buildForm();

  public readonly formId = uuid();

  private readonly subscriptions: (Subscription | undefined)[] = [];

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId!: string;

  @Input()
  public trophy: Trophy | null | undefined;

  @Input()
  public trophyId: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly cancelled = new EventEmitter<void>();

  @Output()
  public readonly saved = new EventEmitter<string>();

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

    if ("trophy" in changes) {
      this.form.patchValue({
        ...this.trophy,
        boatRef: this.trophy?.boatRef?.path || null,
      }, {
        emitEvent: false,
      })

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.subscriptions.forEach((s) => s?.unsubscribe());
  }

  // ========================
  // Methods
  // ========================

  private buildForm(): FormGroup<TrophyFormData> {
    return this.formBuilder.group<TrophyFormData>({
      conditions: this.formBuilder.control<string>("", { nonNullable: true }),
      details: this.formBuilder.control<string>("", { nonNullable: true }),
      donated: this.formBuilder.control<string>("", { nonNullable: true }),
      donor: this.formBuilder.control<string>("", { nonNullable: true }),
      name: this.formBuilder.control<string>("", { nonNullable: true }),
      page: this.formBuilder.control<string>("", { nonNullable: true }),
      boatRef: this.formBuilder.control<string | null>(null),
      public: this.formBuilder.control<boolean>(true, { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private getBoatsObservable(): Observable<DbRecord<Boat>[]> {
    return this.clubId$.pipe(
      filterNotNull(),
      switchMap((clubId) => this.db.getBoats(clubId)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  public async saveTrophy(): Promise<string> {
    const isNew = !this.trophyId;
    const doc = this.db.getTrophyDoc(this.clubId, this.trophyId);
    const trophy = await this.db.addBoatRef(
      this.form.getRawValue(),
      this.boats$,
    );

    if (isNew) {
      await this.db.addRecord(doc, trophy);
    } else {
      await this.db.updateRecord(doc, trophy);
    }

    return doc.ref.id;
  }

  // ========================
  // Event handlers
  // ========================

  public onCancelClick(): void {
    this.cancelled.next();
  }

  public async onSaveClick(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const trophyId = await this.saveTrophy();

    this.saved.next(trophyId);
  }
}
