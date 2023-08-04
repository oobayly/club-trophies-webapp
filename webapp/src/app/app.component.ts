import { Component, OnInit } from "@angular/core";
import { Auth, authState, signInWithEmailAndPassword, signOut } from "@angular/fire/auth";
import { combineLatest, filter, first, map, mergeMap, Observable, of, shareReplay, startWith, Subscription, switchMap, tap } from "rxjs";
import { idToken, isAdmin } from "./core/rxjs/auth";
import { environment } from "src/environments/environment";
import { ModalService } from "./core/services/modal.service";
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { DbService } from "./core/services/db.service";
import { Club } from "@models";
import { filterNotNull } from "./core/rxjs";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { collectionSnapshots, query, where } from "@angular/fire/firestore";

interface Ids {
  clubId: string | undefined;
  trophyId: string | undefined;
}

interface SimpleClub extends Pick<Club, "name" | "admins"> {
  id: string;
}

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnInit {
  // ========================
  // Properties
  // ========================

  public email?: string = undefined;

  public readonly emails = (environment as { emails?: string[][] }).emails;

  public isNavBarCollapsed = true;

  // ========================
  // Derived Observables
  // ========================

  public readonly user$ = authState(this.auth);

  public readonly isAdmin$ = this.user$.pipe(idToken(), isAdmin());

  public readonly ids$ = this.getIdsObservable();

  public readonly myClubs$ = this.getMyClubsObservable();

  public readonly canEdit$ = this.getCanEditObservable();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly auth: Auth,
    private readonly db: DbService,
    private readonly modal: ModalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly swUpdate: SwUpdate,
  ) {
    this.getUpdateSubscription();
  }

  ngOnInit(): void {
    if (!environment.production) {
      this.user$.pipe(
        map((u) => u?.email),
      ).subscribe((email) => this.email = email || undefined);
    }
  }

  // ========================
  // Methods
  // ========================

  private getCanEditObservable(): Observable<boolean> {
    return combineLatest([
      this.isAdmin$,
      this.user$,
      this.ids$.pipe(filterNotNull()),
      this.myClubs$,
    ]).pipe(
      map(([isAdmin, user, ids, myClubs]) => {
        const { clubId } = ids;

        if (!clubId || !user) {
          return false;
        }

        if (isAdmin) {
          return true;
        }

        const activeClub = myClubs.find((x) => x.id === ids.clubId);
        const isMine = activeClub?.admins.includes(user?.uid);

        return !!isMine;
      }),
    )
  }

  private getIdsObservable(): Observable<Ids | undefined> {
    return this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      tap(() => this.isNavBarCollapsed = true),
      map(() => this.route.snapshot),
      startWith(this.route.snapshot),
      map((snapshot) => {
        let clubId: string | undefined;
        let trophyId: string | undefined;
        let child: ActivatedRouteSnapshot | null = snapshot;

        do {
          clubId = clubId || child.paramMap.get("clubId") || child.data["clubId"] || child.queryParamMap.get("clubId");
          trophyId = trophyId || child.paramMap.get("trophyId") || child.data["trophyId"] || child.queryParamMap.get("trophyId");

          child = child.firstChild;
        } while (child);

        if (!clubId) {
          return undefined;
        }

        return { clubId, trophyId };
      }),
      shareReplay(1),
    );
  }

  private getMyClubsObservable(): Observable<SimpleClub[]> {
    return this.user$.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }

        return collectionSnapshots(query(this.db.getClubsCollection(), where("admins", "array-contains", user.uid)));
      }),
      map((items) => {
        return items
          .map((item) => {
            const { admins, name } = item.data();

            return {
              id: item.id,
              name,
              admins,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          ;
      }),
      shareReplay(1),
    );
  }

  private getUpdateSubscription(): Subscription {
    return this.swUpdate.versionUpdates.pipe(
      filter((x): x is VersionReadyEvent => x.type === "VERSION_READY"),
      first(),
      mergeMap(() => {
        return this.modal.showAlert({
          buttons: "yes-no",
          icon: "info",
          title: "New update available",
          message: "Do you want to reload the app now?",
        });
      }),
    ).subscribe((response) => {
      if (response) {
        document.location.reload();
      }
    });
  }

  // ========================
  // Event handlers
  // ========================

  public async onAddFileClick(ids: Ids): Promise<void> {
    if (!ids.clubId || !ids.trophyId) {
      return;
    }

    await this.modal.showFileUpload(ids.clubId, ids.trophyId);
  }

  public async onAddWinnerClick(ids: Ids): Promise<void> {
    if (!ids.clubId || !ids.trophyId) {
      return;
    }

    await this.modal.showEditWinner(ids.clubId, ids.trophyId);
  }

  public async onEditClubClick(clubId?: string): Promise<void> {
    const isNew = !!clubId;

    clubId = await this.modal.showEditClub(clubId);

    if (isNew && clubId) {
      await this.router.navigate(["/clubs", clubId]);
    }
  }

  public async onEditTrophyClick(ids: Ids): Promise<void> {
    if (!ids.clubId) {
      return;
    }

    await this.modal.showEditTrophy(ids.clubId, ids.trophyId);
  }

  public async onEmailClick(email: string | undefined): Promise<void> {
    if (email) {
      if (email !== this.auth.currentUser?.email) {
        await signInWithEmailAndPassword(this.auth, email, "Password");
      }

    } else {
      await signOut(this.auth);
    }
  }

  public async onUpdateLogoClick(clubId: string | undefined): Promise<void> {
    if (!clubId) {
      return;
    }

    await this.modal.showFileUpload(clubId);
  }
}
