import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, map, Observable, of, shareReplay, Subject, switchMap, takeUntil, tap } from "rxjs";
import { Club, Collections, Trophy } from "@models";
import { DbRecord } from "src/app/core/interfaces/DbRecord";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { distinctUid } from "src/app/core/rxjs/auth";
import { ModalService } from "src/app/core/services/modal.service";

@Component({
  selector: "app-club-info",
  templateUrl: "./club-info.component.html",
  styleUrls: ["./club-info.component.scss"],
})
export class ClubInfoComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public readonly canEdit$: Observable<boolean>;

  public readonly clubId$ = new BehaviorSubject<string | undefined>(undefined);

  public readonly club$: Observable<Club | undefined>;

  private readonly destroyed$ = new Subject<void>();

  // ========================
  // Inputs
  // ========================

  @Input()
  public clubId: string | null | undefined;

  // ========================
  // Outputs
  // ========================

  @Output()
  public readonly canEditChange = new EventEmitter<boolean>();

  @Output()
  public readonly clubChange = new EventEmitter<Club | undefined>();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly db: AngularFirestore,
    private readonly modal2: ModalService,
  ) {
    this.club$ = this.getClubObservable();
    this.canEdit$ = this.getCanEditObservable();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("clubId" in changes) {
      this.clubId$.next(this.clubId || undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  // ========================
  // Methods
  // ========================

  private getCanEditObservable(): Observable<boolean> {
    return combineLatest([
      this.auth.user.pipe(distinctUid()),
      this.club$,
    ]).pipe(
      map(([uid, club]) => {
        return !!uid && !!club && club.admins.includes(uid);
      }),
      tap((x) => this.canEditChange.next(x)),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  private getClubObservable(): Observable<Club | undefined> {
    return this.clubId$.pipe(
      distinctUntilChanged(),
      switchMap((clubId) => {
        if (!clubId) {
          return of(undefined);
        }

        return this.db.collection<Club>(Collections.Clubs).doc(clubId).snapshotChanges().pipe(
          catchError((err) => {
            console.log(err.code);

            return of(undefined);
          }),
        );
      }),
      map((doc) => doc?.payload.data()),
      tap((club) => {
        this.clubChange.next(club);
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
    );
  }

  // ========================
  // Event handlers
  // ========================

  public onUploadClick(): void {
  }

  public async onEditClick(club: Club): Promise<void> {
    if (!this.clubId) {
      return;
    }

    await this.modal2.showEditClub(this.clubId, club);
  }

  public onTrophyClick(item: DbRecord<Trophy>): void {
    console.log(item);
  }
}
