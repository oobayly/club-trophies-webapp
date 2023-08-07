import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { collection, collectionSnapshots, deleteDoc } from "@angular/fire/firestore";
import { Collections, TrophyFile } from "@models";
import { BehaviorSubject, Observable, firstValueFrom, map, shareReplay, switchMap, takeUntil, tap } from "rxjs";
import { compareTimestamps, uuid } from "src/app/core/helpers";
import { DbRecord, toRecord } from "src/app/core/interfaces/DbRecord";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";
import { ModalService } from "src/app/core/services/modal.service";
import { TrophyBaseComponent } from "../trophy-base-component";

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

  public readonly fileId = uuid();

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
  private readonly fileUpload?: ElementRef<HTMLInputElement>;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    auth: Auth,
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
    return this.getTrophyRefObservable().pipe(
      filterNotNull(),
      switchMap((ref) => collectionSnapshots(collection(ref, Collections.Files))), //  ref.collection<TrophyFile>(Collections.Files).snapshotChanges()),
      map((snapshot) => {
        return (toRecord(snapshot) as DbRecord<TrophyFile>[]) // No f!$@ing generics
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

    await this.modal.showFileUpload(clubId, trophyId, files);

    if (this.fileUpload?.nativeElement) {
      this.fileUpload.nativeElement.value = "";
    }
  }

  // ========================
  // Event handlers
  // ========================

  public async onDeleteFileClick(item: DbRecord<TrophyFile>): Promise<void> {
    const resp = await this.modal.showDelete("Delete File", "Are you sure you want to delete this file?");

    if (!resp) {
      return;
    }

    const { clubId, trophyId } = item.data.parent;
    const docRef = this.db.getFileDoc(clubId, trophyId, item.id);

    await deleteDoc(docRef);
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
