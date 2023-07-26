import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Subscription } from "rxjs";
import { v4 as uuid } from "uuid";
import { Club, Collections } from "@models";

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
    private readonly db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
    }

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
    const doc = this.db.collection(Collections.Clubs).doc<Club>(this.clubId || undefined);
    const club = this.form.getRawValue();

    if (isNew) {
      const uid = (await this.auth.currentUser)!.uid;

      await doc.set({
        ...club,
        admins: [uid],
        created: Date.now(),
      });
    } else {
      await doc.update({
        ...club,
        modified: Date.now(),
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
