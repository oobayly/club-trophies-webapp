import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { Trophy, removeEmptyStrings } from "@models"
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
  public trophy?: Trophy;

  @Input()
  public trophyId?: string;

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

  public async saveTrophy(): Promise<string> {
    const trophy = await this.db.withBoatRef({
      ...this.form.value,
      name: this.form.value.name!, // Name is a required property
      public: !!this.form.value.public,
      parent: {
        clubId: this.clubId,
      },
    });

    removeEmptyStrings(trophy, ["conditions", "details", "donated", "donor", "page"]);

    if (this.trophyId) {
      return await this.db.updateRecord(
        this.db.getTrophyDoc(this.clubId, this.trophyId),
        trophy,
      );
    } else {
      const docRef = await this.db.addRecord(
        this.db.getTrophyCollection(this.clubId),
        trophy,
      );

      return docRef.id;
    }
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
