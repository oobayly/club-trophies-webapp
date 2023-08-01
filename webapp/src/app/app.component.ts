import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { combineLatest, filter, map, Observable, of, shareReplay, startWith, switchMap, tap } from "rxjs";
import { isAdmin } from "./core/rxjs/auth";
import { environment } from "src/environments/environment";
import { ModalService } from "./core/services/modal.service";
import { ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { DbService } from "./core/services/db.service";
import { Club } from "@models";
import { filterNotNull } from "./core/rxjs";

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

  public readonly user$ = this.auth.user;

  public readonly isAdmin$ = this.auth.idTokenResult.pipe(isAdmin());

  public readonly ids$ = this.getIdsObservable();

  public readonly myClubs$ = this.getMyClubsObservable();

  public readonly canEdit$ = this.getCanEditObservable();

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly db: DbService,
    private readonly modal: ModalService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
  }

  ngOnInit(): void {
    if (!environment.production) {
      this.auth.user.pipe(
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
    return this.auth.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }

        return this.db.getClubsCollection((ref) => ref.where("admins", "array-contains", user.uid)).snapshotChanges();
      }),
      map((items) => {
        return items
          .map((item) => {
            const { admins, name } = item.payload.doc.data();

            return {
              id: item.payload.doc.id,
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

  // ========================
  // Event handlers
  // ========================

  public async onAddClubClick(): Promise<void> {
    const clubId = await this.modal.showAddClub();

    if (clubId) {
      await this.router.navigate(["/clubs", clubId]);
    }
  }

  public async onEmailClick(email: string | undefined): Promise<void> {
    if (email) {
      const current = await this.auth.currentUser;

      if (email !== current?.email) {
        await this.auth.signInWithEmailAndPassword(email, "Password");
      }

    } else {
      await this.auth.signOut();
    }
  }
}
