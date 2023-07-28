import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Collections, TrophyFile } from "@models";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { uuid } from "src/app/core/helpers";

interface FileFormData {
  description: FormControl<string>;
}

@Component({
  selector: "app-trophy-file-editor",
  templateUrl: "./trophy-file-editor.component.html",
  styleUrls: ["./trophy-file-editor.component.scss"],
})
export class TrophyFileEditorComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  private readonly destroyed$ = new Subject<void>();

  public readonly form = this.buildForm();

  public readonly formId = uuid();

  public readonly isPhoto$ = new BehaviorSubject(false);

  private readonly subscriptions: (Subscription | undefined)[] = [];

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId!: string;

  @Input()
  public fileId!: string;

  @Input()
  public file!: TrophyFile;

  @Input()
  public trophyId!: string;

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
    private readonly db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if ("file" in changes) {
      this.form.patchValue(this.file || {}, {
        emitEvent: false,
      })

      this.isPhoto$.next(/^image\//i.test(this.file.contentType));
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

  private buildForm(): FormGroup<FileFormData> {
    return this.formBuilder.group<FileFormData>({
      description: this.formBuilder.control<string>("", { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  public async saveFile(): Promise<string> {
    const doc = this.db.collection(Collections.Clubs).doc(this.clubId)
      .collection(Collections.Trophies).doc(this.trophyId)
      .collection<TrophyFile>(Collections.Files).doc(this.fileId)
      ;
    const file = this.form.getRawValue();

    await doc.update({
      ...file,
      modified: Date.now(),
    });

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

    const fileId = await this.saveFile();

    this.saved.next(fileId);
  }
}
