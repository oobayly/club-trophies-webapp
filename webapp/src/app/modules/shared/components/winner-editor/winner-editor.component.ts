import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { Subject, BehaviorSubject, Subscription, firstValueFrom, Observable, shareReplay, switchMap, takeUntil } from "rxjs";
import { Boat, Collections, Winner } from "@models";
import { DbRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { createdTimestamp, modifiedTimestamp, uuid } from "src/app/core/helpers";
import { DbService } from "src/app/core/services/db.service";

interface WinnerFormData {
  club: FormControl<string>;
  crew: FormControl<string>;
  helm: FormControl<string>;
  name: FormControl<string>;
  notes: FormControl<string>;
  sail: FormControl<string>;
  owner: FormControl<string>;
  year: FormControl<number>;
  boatRef: FormControl<string | null>;
}

@Component({
  selector: "app-winner-editor",
  templateUrl: "./winner-editor.component.html",
  styleUrls: ["./winner-editor.component.scss"],
})
export class WinnerEditorComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly boats$: Observable<DbRecord<Boat>[]>;

  private readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly destroyed$ = new Subject<void>();

  public readonly form = this.buildForm();

  public readonly formId = uuid();

  public readonly isPhoto$ = new BehaviorSubject(false);

  private readonly subscriptions: (Subscription | undefined)[] = [];

  // ========================
  // Inputs
  // ========================

  @Input()
  public boatRef?: string;

  @Input()
  public clubId!: string;

  @Input()
  public trophyId!: string;

  @Input()
  public winner: Winner | null | undefined;;

  @Input()
  public winnerId: string | null | undefined;;

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
    if ("boatRef" in changes) {
      this.form.patchValue({ boatRef: this.boatRef || null });
    }

    if ("clubId" in changes) {
      this.clubId$.next(this.clubId);
    }

    if ("winner" in changes && this.winner) {
      this.form.patchValue({
        ...this.winner,
        boatRef: this.winner?.boatRef?.path || this.boatRef || null,
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

  private buildForm(): FormGroup<WinnerFormData> {
    return this.formBuilder.group<WinnerFormData>({
      club: this.formBuilder.control<string>("", { nonNullable: true }),
      crew: this.formBuilder.control<string>("", { nonNullable: true }),
      helm: this.formBuilder.control<string>("", { nonNullable: true }),
      name: this.formBuilder.control<string>("", { nonNullable: true }),
      notes: this.formBuilder.control<string>("", { nonNullable: true }),
      sail: this.formBuilder.control<string>("", { nonNullable: true }),
      owner: this.formBuilder.control<string>("", { nonNullable: true }),
      year: this.formBuilder.control<number>(new Date().getFullYear(), { nonNullable: true }),
      boatRef: this.formBuilder.control<string | null>(null),
    }, {
      updateOn: "change",
    });
  }

  private async getBoat(ref: string | null): Promise<DbRecord<Boat> | null> {
    const found = (await firstValueFrom(this.boats$)).find((x => x.ref.path === ref));

    return found || null;
  }

  private getBoatsObservable(): Observable<DbRecord<Boat>[]> {
    return this.clubId$.pipe(
      filterNotNull(),
      switchMap((clubId) => this.db.getBoats(clubId)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  public async saveWinner(): Promise<string> {
    const isNew = !this.winnerId;
    const doc = this.db.firestore.collection(Collections.Clubs).doc(this.clubId)
      .collection(Collections.Trophies).doc(this.trophyId)
      .collection<Winner>(Collections.Winners).doc(this.winnerId || undefined)
      ;
    const winner = this.form.getRawValue();
    const boat = await this.getBoat(winner.boatRef);

    if (isNew) {
      await doc.set({
        ...winner,
        boatName: boat?.data.name || null,
        boatRef: boat?.ref || null,
        ...createdTimestamp(),
      });
    } else {
      await doc.update({
        ...winner,
        boatName: boat?.data.name || null,
        boatRef: boat?.ref || null,
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

    const winnerId = await this.saveWinner();

    this.saved.next(winnerId);
  }
}
