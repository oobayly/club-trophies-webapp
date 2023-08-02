import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { TrophyBaseComponent } from "../trophy-base-component";
import { BehaviorSubject, Observable, first, firstValueFrom, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { Collections, TrophyFile } from "@models";
import { filterNotNull } from "src/app/core/rxjs";
import { ModalService } from "src/app/core/services/modal.service";
import { environment } from "src/environments/environment";
import { compareTimestamps, createdTimestamp } from "src/app/core/helpers";
import { DbService } from "src/app/core/services/db.service";

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

  @ViewChild("fileDrop")
  private readonly fileDrop?: ElementRef<HTMLElement>;

  @ViewChild("fileUpload")
  private readonly fileUpload?: ElementRef<HTMLElement>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: AngularFireAuth,
    db: DbService,
    private readonly modal: ModalService,
  ) {
    super(auth, db);

    this.files$ = this.getFilesObservable();
    this.photos$ = this.files$.pipe(
      map((items) => items.filter((x) => /^image\//i.test(x.data.contentType))),
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
          .sort((a, b) => compareTimestamps(a.data.created, b.data.created))
          ;
      }),
      tap((items) => this.countChange.next(items.length)),
      takeUntil(this.destroyed$),
      shareReplay(1),
    );
  }

  private async uploadFiles(files: File[] | FileList): Promise<void> {
    if (!Array.isArray(files)) {
      files = Array.from(files);
    }

    if (!files.length) {
      return;
    }

    const { clubId, trophyId } = this;

    if (!clubId || !trophyId) {
      return;
    }

    for (let i = 0; i < files.length; i++) {
      await this.uploadFile(clubId, trophyId, files[i]);
    }
  }

  private async uploadFile(clubId: string, trophyId: string, file: File): Promise<string> {
    // Listen for the document we're going to create, and get it once the upload data is present
    const doc = this.db.getFileDoc(clubId, trophyId);
    const snapshot = doc.snapshotChanges().pipe(
      map((item) => item.payload.data()?.uploadInfo),
      filterNotNull(),
      first(),
    );

    await doc.set({
      contentType: file.type,
      description: "",
      name: file.name,
      ...createdTimestamp(),
      url: null,
      thumb: null,
      parent: {
        clubId: clubId,
        trophyId: trophyId,
      },
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
        await doc.delete();
      }
    }

    return doc.ref.id;
  }

  // ========================
  // Event handlers
  // ========================

  public async onDeleteFileClick(item: DbRecord<TrophyFile>): Promise<void> {
    const resp = await this.modal.showDelete("Delete File", "Are you sure you want to delete this file?");

    if (!resp) {
      return;
    }

    const ref = (await firstValueFrom(this.getTrophyRefObservalble()))?.collection<TrophyFile>(Collections.Files).doc(item.id);

    await ref?.delete();
  }

  public onDragEnter(e: DragEvent): void {
    if (!this.canEdit) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.fileDrop?.nativeElement.classList.add("dragging");
  }

  public onDragLeave(e: DragEvent): void {
    if (!this.canEdit) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.fileDrop?.nativeElement.classList.remove("dragging");
  }

  public async onDrop(e: DragEvent): Promise<void> {
    if (!this.canEdit) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    this.fileDrop?.nativeElement.classList.remove("dragging");

    const allowedTypes = /^image\/(jpeg|png|gif)/;
    const files = Array
      .from(e.dataTransfer?.files || [])
      .filter((f) => allowedTypes.test(f.type))
      ;

    if (!files.length) {
      return;
    }

    await this.uploadFiles(files);
  }

  public async onEditFileClick(id: string): Promise<void> {
    if (!this.clubId || !this.trophyId) {
      return;
    }

    await this.modal.showEditTrophyFile(this.clubId, this.trophyId, id);
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

  public triggerUpload(_e: Event): void {
    this.fileUpload?.nativeElement.click();
  }
}
