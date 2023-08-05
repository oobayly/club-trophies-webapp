import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from "@angular/core";
import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { uuid } from "@helpers";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, filter, finalize, first, from, interval, last, map, mergeMap, of, startWith, switchMap, take, tap } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";
import { ImageCroppedEvent, ImageCropperComponent } from "ngx-image-cropper";
import { resizeImageFiles } from "@helpers/image-resize";
import { CollectionReference, docSnapshots } from "@angular/fire/firestore";
import { HasExpires, HasTimestamp, HasUploadInfo } from "@models";

export type UploadMode = "logo" | "trophy-file";

interface QueueItem {
  file: File;
  index: number;
  progress: number;
  started?: boolean;
  result?: string;
};

@Component({
  selector: "app-file-upload",
  templateUrl: "./file-upload.component.html",
  styleUrls: ["./file-upload.component.scss"],
})
export class FileUploadComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly formId = uuid();

  // ========================
  // Observables
  // ========================

  private readonly cancel$ = new Subject<true>();

  public readonly queue$ = new BehaviorSubject<QueueItem[] | undefined>(undefined);

  public readonly isUploading$ = this.queue$.pipe(map((x) => !!x?.length));

  public readonly filesPlural = { "=1": "1 file", "other": "# files" };

  private readonly subscriptions: Subscription[] = [];

  public logoFile?: File;

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId!: string;

  @Input()
  public files?: File[];

  @Input()
  public mode: UploadMode = "trophy-file";

  @Input()
  public trophyId: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly cancelled = new EventEmitter<void>();

  @Output()
  public readonly uploaded = new EventEmitter<string | string[]>();

  // ========================
  // View children
  // ========================

  @ViewChild("imageCropper")
  public imageCropper?: ImageCropperComponent;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private db: DbService,
    private readonly httpClient: HttpClient,
  ) {
    this.subscriptions.push(this.getProgressSubscription());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("files" in changes && this.files?.length) {
      this.startUpload();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe first so the getProgressSubscription doesn't fire and try raising uploaded/cancelled evnts
    this.subscriptions.forEach((s) => s.unsubscribe());

    // Then cancel so we ensure the underlying requests are finalized
    this.cancel$.next(true);
  }

  // ========================
  // Methods
  // ========================

  private getProgressSubscription(): Subscription {
    return this.queue$.pipe(
      filterNotNull(),
      first(), // Only take the first as this queue will update as the progress changes
      mergeMap((items) => {
        // From the initials queue, create a list of uploads to run in parallet        
        const requests = items.map((x) => this.getQueueItemObservable(x));

        return combineLatest(requests);
      }, 2),
    ).subscribe({
      next: (items) => {
        const ids = items
          .map((x) => x?.result)
          .filter((x): x is string => !!x)
          ;

        if (!ids.length) {
          // No results mean we were cancelled
          this.cancelled.next();

          return;
        }

        if (this.mode === "logo") {
          this.uploaded.next(ids[0]);
        } else if (this.mode === "trophy-file") {
          this.uploaded.next(ids);
        }
      },
      error: (e) => {
        console.log("Error", e);

        this.cancelled.next();
      },
    });
  }

  private getQueueItemObservable(item: QueueItem): Observable<QueueItem | undefined> {
    return combineLatest([
      of(item),
      this.cancel$.pipe(first(), startWith(false)),
    ]).pipe(
      switchMap(([item, cancel]) => {
        let response: Observable<string | undefined>;

        if (cancel) {
          response = of(undefined);
        } else {
          if (this.mode === "logo") {
            response = this.getFileObservable(
              item,
              this.db.getClubLogosCollection(this.clubId),
              {},
            );
          } else if (this.mode === "trophy-file") {
            response = this.getFileObservable(
              item,
              this.db.getFilesCollection(this.clubId, this.trophyId!),
              {
                contentType: item.file.type,
                name: "name" in item.file ? item.file.name : uuid(),
                parent: {
                  clubId: this.clubId,
                  trophyId: this.trophyId!,
                },
              },
            );

          } else {
            response = of(undefined);
          }

        }

        return combineLatest([of(item), response]);
      }),
      map(([item, response]) => {
        item.result = response;

        return item;
      }),
      first(),
    );
  }

  private getFileObservable<T extends HasUploadInfo & HasExpires & HasTimestamp>(
    item: QueueItem,
    collection: CollectionReference<T>,
    value: Omit<T, "modified" | "created">,
  ): Observable<string> {

    // Add the record first, and get a listener to that document
    const uploadDoc$ = from(this.db.addRecord(
      collection, {
      ...value,
      expireAfter: new Date(Date.now() + 3600000),// Expires after 1 hours
    })).pipe(
      switchMap((docRef) => docSnapshots(docRef)),
    );

    // This does the uploading
    const upload$ = uploadDoc$.pipe(
      // Wait until we have some upload info
      filter((x) => !!x.data()?.uploadInfo),
      // And only use the first 
      first(),
      // From this we can upload the file
      switchMap((info) => {
        const { id } = info;
        const { url, headers } = info.data()?.uploadInfo!;

        return this.getUploadObservable(item, url, headers, id);
      }),
    )

    // This wait until the firebase function has processed the upload
    return combineLatest([
      uploadDoc$,
      upload$,
    ]).pipe(
      // Wait until the upload info has been removed
      filter(([uploadDoc]) => {
        return uploadDoc.data()?.uploadInfo === undefined;
      }),
      // And simply return the ID of the uploaded file
      map(([uploadDoc]) => uploadDoc.id),
    );
  }

  private _getTestObservable(item: QueueItem): Observable<string> {
    const ms = 25 + (Math.random() * 100);

    return interval(ms).pipe(
      take(100),
      tap(() => {
        this.updateProgress(item, item.progress + 1);
      }),
      last(),
      map(() => `Result ${uuid()} `),
      finalize(() => console.log(`${item.file} is finalized`)),
    );
  }

  private getUploadObservable(item: QueueItem, url: string, headers: { [key: string]: string }, fileId: string): Observable<string> {
    return this.httpClient.put(url, item.file, {
      headers,
      reportProgress: true,
      observe: "events",
    }).pipe(
      tap((x) => {
        const event = x as HttpEvent<unknown>;

        if (event.type === HttpEventType.UploadProgress) {
          if (event.total) {
            const percent = Math.round(100 * event.loaded / event.total);

            this.updateProgress(item, percent);
          }
        } else if (event.type === HttpEventType.Response) {
          this.updateProgress(item, 100);
        }
      }),
      last(),
      map(() => fileId),
    );
  }

  private startUpload(): void {
    if (!this.files?.length) {
      return;
    }

    const items = Array.from(this.files).map((file, index): QueueItem => {
      return {
        file,
        index,
        progress: 0,
      };
    });

    this.queue$.next(items);
  }

  private updateProgress(item: QueueItem, progress: number): void {
    item.started = true;
    item.progress = progress;

    this.queue$.next(this.queue$.value);
  }

  // ========================
  // Event handlers
  // ========================

  public onCancelClick(): void {
    this.cancel$.next(true);
    this.cancelled.next();
  }

  public onImageCropped(e: ImageCroppedEvent): void {
    if (!e.blob) {
      this.files = undefined;

      return;
    }

    this.files = [new File([e.blob], "logo.png", {
      type: "image/png",
    })];
  }

  public onLogoFileChange(e: Event): void {
    const files = (e.target as HTMLInputElement)?.files;

    if (!files?.length) {
      return;
    }

    this.files = Array.from(files);
    this.logoFile = files[0];
  }

  public async onTrophyFileChange(e: Event): Promise<void> {
    const files = (e.target as HTMLInputElement)?.files;

    if (!files?.length) {
      return;
    }

    this.files = await resizeImageFiles(Array.from(files), { maxSize: 1000, quality: 85 })
  }

  public onUploadClick(): void {
    this.startUpload();
  }
}
