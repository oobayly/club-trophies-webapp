import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { TrophyBaseComponent } from "../trophy-base-component";
import { BehaviorSubject, Observable, first, firstValueFrom, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/compat/firestore";
import { FormBuilder } from "@angular/forms";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { Collections, TrophyFile } from "@models";
import { filterNotNull } from "src/app/core/rxjs";
import { ModalService } from "src/app/core/services/modal.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-files-list",
  templateUrl: "./files-list.component.html",
  styleUrls: ["./files-list.component.scss"],
})
export class FilesListComponent extends TrophyBaseComponent implements OnChanges {
  // ========================
  // Properties
  // ========================

  public readonly canEdit$ = new BehaviorSubject<boolean | undefined>(undefined);

  public readonly files$: Observable<DbRecord<TrophyFile>[]>;

  public readonly photos$: Observable<DbRecord<TrophyFile>[]>;

  // ========================
  // Inputs
  // ========================

  @Input()
  public canEdit: boolean | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly countChange = new EventEmitter<number>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: AngularFireAuth,
    db: AngularFirestore,
    private readonly formBuilder: FormBuilder,
    private readonly modal: ModalService,
  ) {
    super(auth, db);

    this.files$ = this.getFilesObservable();
    this.photos$ = this.files$.pipe(
      map((items) => items.filter((x) => x.data.contentType.startsWith("image"))),
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("canEdit" in changes) {
      this.canEdit$.next(this.canEdit || undefined);
    }
  }

  // ========================
  // Methods
  // ========================

  private getFilesObservable(): Observable<DbRecord<TrophyFile>[]> {
    return this.getTrophyRefObservalble().pipe(
      filterNotNull(),
      switchMap((ref) => ref.collection<TrophyFile>(Collections.Files).snapshotChanges()),
      map((snapshot) => {
        return toRecord(snapshot)
          .filter((x) => x.data.url && !x.data.uploadInfo) // We don't want to see any interim uploads
          .sort((a, b) => a.data.created - b.data.created)
          ;
      }),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  // ========================
  // Event handlers
  // ========================

  public async onDeleteFileClick(item: DbRecord<TrophyFile>): Promise<void> {
    const ref = (await firstValueFrom(this.getTrophyRefObservalble()))?.collection<TrophyFile>(Collections.Files).doc(item.id);

    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    await ref?.delete();
  }

  public async onEditFileClick(_item: DbRecord<TrophyFile>): Promise<void> {
    // TODO: Add edit file modal
  }

  public async onFileChange(e: Event): Promise<void> {
    const files = (e.target as HTMLInputElement)?.files;

    if (!files) {
      return;
    }

    await this.uploadFiles(files);
  }

  public async onFileClick(item: DbRecord<TrophyFile>): Promise<void> {
    const photos = (await firstValueFrom(this.photos$));

    await this.modal.showLightbox(photos, item.id);
  }

  private async uploadFiles(files: File[] | FileList): Promise<void> {
    if (!Array.isArray(files)) {
      files = Array.from(files);
    }

    if (!files.length) {
      return;
    }

    const colRef = (await firstValueFrom(this.getTrophyRefObservalble()))?.collection<TrophyFile>(Collections.Files);

    console.log(colRef);

    if (!colRef) {
      return;
    }

    await this.uploadFile(colRef, files[0]);
  }

  private async uploadFile(colRef: AngularFirestoreCollection<TrophyFile>, file: File): Promise<string> {
    const docRef = colRef.doc();

    // Listen for the document we're going to create, and get it once the upload data is present
    const snapshot = docRef.snapshotChanges().pipe(
      map((item) => item.payload.data()?.uploadInfo),
      filterNotNull(),
      first(),
    );

    await docRef.set({
      contentType: file.type,
      description: "",
      name: file.name,
      created: Date.now(),
    });

    const uploadInfo = await firstValueFrom(snapshot);
    const { url, headers } = uploadInfo;

    try {
      await fetch(url, {
        method: "PUT",
        headers: headers,
        body: file,
      });
    } catch {
      if (!environment.emulate) {
        await docRef.delete();
      }
    }

    return docRef.ref.id;
  }
}
