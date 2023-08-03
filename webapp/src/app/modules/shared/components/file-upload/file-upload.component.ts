import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { createdTimestamp, uuid } from "@helpers";
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, finalize, first, interval, last, map, of, startWith, switchMap, take, tap } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";

export type UploadMode = "logo" | "trophy-file";

type FileLike = File | Blob;

interface QueueItem {
  file: FileLike;
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

  private readonly subscriptions: Subscription[] = [];

  public logoFile?: File;

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId!: string;

  @Input()
  public files?: FileList | File[];

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
      switchMap((items) => {
        // From the initials queue, create a list of uploads to run in parallet        
        const requests = items.map((x) => this.getQueueItemObservable(x));

        return combineLatest(requests);
      }),
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
            response = this.getLogoFileObservale(item);
          } else if (this.mode === "trophy-file") {
            response = this.getTrophyFileObservable(item);
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

  private getLogoFileObservale(item: QueueItem): Observable<string> {
    const { clubId } = this;

    const doc = this.db.getClubLogoDoc(clubId);
    const fileId = doc.ref.id;
    const snapshot = doc.snapshotChanges().pipe(
      map((item) => item.payload.data()?.uploadInfo),
      filterNotNull(),
      first(),
    );

    doc.set({
      ...createdTimestamp(),
    }).then();

    return snapshot.pipe(
      switchMap((info) => {
        return this.getUploadObservable(item, info.url, info.headers, fileId);
      }),
    );
  }

  private getTestObservable(item: QueueItem): Observable<string> {
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

  private getTrophyFileObservable(item: QueueItem): Observable<string> {
    const { clubId, trophyId } = this;

    if (!trophyId) {
      throw new Error("Cannot upload trophy file without trophyId");
    }

    const doc = this.db.getFileDoc(clubId, trophyId);
    const fileId = doc.ref.id;
    const snapshot = doc.snapshotChanges().pipe(
      map((item) => item.payload.data()?.uploadInfo),
      filterNotNull(),
      first(),
    );

    doc.set({
      contentType: item.file.type,
      description: "",
      name: "name" in item.file ? item.file.name : uuid(),
      ...createdTimestamp(),
      url: null,
      thumb: null,
      parent: {
        clubId,
        trophyId,
      },
      expireAfter: new Date(Date.now() + 3600000),// Expires after 1 hours
    }).then();

    return snapshot.pipe(
      switchMap((info) => {
        return this.getUploadObservable(item, info.url, info.headers, fileId);
      }),
    );
  }

  private getUploadObservable(item: QueueItem, url: string, headers: { [key: string]: string }, fileId: string): Observable<string> {
    return this.httpClient.put(url, item.file, {
      headers,
      reportProgress: true,
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

  public onLogoFileChange(e: Event): void {
    const files = (e.target as HTMLInputElement)?.files;

    if (!files?.length) {
      return;
    }

    this.logoFile = files[0];
  }

  public async onTrophyFileChange(e: Event): Promise<void> {
    const files = (e.target as HTMLInputElement)?.files;

    if (!files?.length) {
      return;
    }

    this.files = files;
    this.startUpload();
  }

  public onUploadClick(): void {
    this.startUpload();
  }
}
