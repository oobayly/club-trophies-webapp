import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Subscription } from "rxjs";
import { Club, Collections } from "@models";
import { getCountries } from "src/app/core/helpers/i18n";
import { createdTimestamp, modifiedTimestamp, uuid } from "src/app/core/helpers";
import { DbService } from "src/app/core/services/db.service";

interface ClubFormData {
  country: FormControl<string>;
  public: FormControl<boolean>;
  name: FormControl<string>;
  shortName: FormControl<string>;
}

@Component({
  selector: "app-club-editor",
  templateUrl: "./club-editor.component.html",
  styleUrls: ["./club-editor.component.scss"],
})
export class ClubEditorComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly countries = getCountries("en");

  public readonly form = this.buildForm();

  public readonly formId = uuid();

  private readonly subscriptions: Subscription[] = [];

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  @Input()
  public club: Club | null | undefined;

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
    private readonly auth: AngularFireAuth,
    private readonly db: DbService,
    private readonly formBuilder: FormBuilder,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("club" in changes) {
      this.form.patchValue(this.club || {}, {
        emitEvent: false,
      })

      this.form.markAsPristine();
      this.form.markAsUntouched();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  // ========================
  // Methods
  // ========================

  private buildForm(): FormGroup<ClubFormData> {
    return this.formBuilder.group<ClubFormData>({
      country: this.formBuilder.control<string>("", { nonNullable: true }),
      public: this.formBuilder.control<boolean>(false, { nonNullable: true }),
      name: this.formBuilder.control<string>("", { nonNullable: true }),
      shortName: this.formBuilder.control<string>("", { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private async saveClub(): Promise<string> {
    const isNew = !this.clubId;
    const doc = this.db.firestore.collection(Collections.Clubs).doc<Club>(this.clubId || undefined);
    const club = this.form.getRawValue();

    if (isNew) {
      const uid = (await this.auth.currentUser)!.uid;

      await doc.set({
        ...club,
        logo: null,
        admins: [uid],
        ...createdTimestamp(),
      });
    } else {
      await doc.update({
        ...club,
        ...modifiedTimestamp(),
      });
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

    const clubId = await this.saveClub();

    this.saved.next(clubId);
  }
}
