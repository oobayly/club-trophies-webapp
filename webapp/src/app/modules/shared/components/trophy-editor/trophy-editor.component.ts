import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { BehaviorSubject, Observable, Subject, Subscription, firstValueFrom, map, shareReplay, switchMap, takeUntil } from "rxjs";
import { v4 as uuid } from "uuid";
import { Boat, Collections, Trophy } from "@models"
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";

interface TrophyFormData {
  conditions: FormControl<string>;
  details: FormControl<string>;
  donated: FormControl<string>;
  donor: FormControl<string>;
  name: FormControl<string>;
  page: FormControl<string>;
  boatId: FormControl<string | undefined>;
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
    private readonly db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
  ) {
    this.boats$ = this.getBoatsObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
      this.clubId$.next(this.clubId || undefined);
    }

    if ("trophy" in changes) {
      this.form.patchValue(this.trophy || {}, {
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
      boatId: this.formBuilder.control<string | undefined>(undefined, { nonNullable: true }),
      public: this.formBuilder.control<boolean>(true, { nonNullable: true }),
    }, {
      updateOn: "change",
    });
  }

  private async getBoatName(id: string): Promise<string> {
    const found = (await firstValueFrom(this.boats$)).find((x => x.id === id));

    if (!found) {
      throw new Error("No boat found with that ID.")
    }

    return found.data.name;
  }

  private getBoatsObservable(): Observable<DbRecord<Boat>[]> {
    return this.clubId$.pipe(
      filterNotNull(),
      switchMap((clubId) => {
        return this.db
          .collection(Collections.Clubs).doc(clubId)
          .collection<Boat>(Collections.Boats)
          .snapshotChanges()
          ;
      }),
      map((x) => toRecord(x).sort((a, b) => a.data.name.localeCompare(b.data.name))),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  public async saveTrophy(): Promise<string> {
    const isNew = !this.trophyId;
    const doc = this.db.collection(Collections.Clubs).doc(this.clubId)
      .collection<Trophy>(Collections.Trophies).doc(this.trophyId || undefined);
    const trophy = this.form.getRawValue();
    let boatName: string | undefined;

    if (trophy.boatId) {
      boatName = await this.getBoatName(trophy.boatId);
    } else {
      trophy.boatId = undefined;
      boatName = undefined;
    }

    if (isNew) {
      await doc.set({
        ...trophy,
        boatName,
        created: Date.now(),
      });
    } else {
      await doc.update({
        ...trophy,
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

    const trophyId = await this.saveTrophy();

    this.saved.next(trophyId);
  }
}
