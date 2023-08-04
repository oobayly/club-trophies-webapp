import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { TrophyFile } from "@models";
import { BehaviorSubject, Subject, Subscription } from "rxjs";
import { uuid } from "src/app/core/helpers";
import { DbService } from "src/app/core/services/db.service";

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
    private readonly db: DbService,
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
    const docRef = this.db.getFileDoc(this.clubId, this.trophyId, this.fileId);

    await this.db.updateRecord(
      docRef,
      this.form.getRawValue(),
    );

    return docRef.id;
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
