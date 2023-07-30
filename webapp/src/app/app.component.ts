import { Component, OnDestroy, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { map, Observable, of, shareReplay, Subject, Subscription, switchMap, takeUntil } from "rxjs";
import { isAdmin } from "./core/rxjs/auth";
import { environment } from "src/environments/environment";
import { Club, Collections } from "@models";
import { ModalService } from "./core/services/modal.service";
import { Router } from "@angular/router";
import { DbService } from "./core/services/db.service";

/** Collection of emulated users. */
const Emails = [
  [undefined, "None"],
  ["admin@nothing.com", "Admin"],
  ["ldyc@nothing.com", "LDYC"],
  ["nyyc@nothing.com", "NYYC"],
  ["nobody@nothing.com", "Nobody"],
]

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnDestroy, OnInit {
  // ========================
  // Properties
  // ========================

  public email?: string = undefined;

  public readonly emails = environment.production ? undefined : Emails;

  public isNavBarCollapsed = true;

  private readonly subscriptions: Subscription[] = [];

  // ========================
  // Observables
  // ========================

  private readonly destroyed$ = new Subject<void>();

  public readonly isAdmin$ = this.auth.idTokenResult.pipe(isAdmin());

  public readonly myClubs$: Observable<{ id: string, name: string }[]>;

  public readonly user$ = this.auth.user;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly db: DbService,
    private readonly modal: ModalService,
    private readonly router: Router,
  ) {
    this.myClubs$ = this.getMyClubsObservable();
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.subscriptions.forEach((s) => s.unsubscribe());
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

  private getMyClubsObservable(): Observable<{ id: string, name: string }[]> {
    return this.auth.user.pipe(
      switchMap((user) => {
        if (!user) {
          return of([]);
        }

        return this.db.firestore.collection<Club>(
          Collections.Clubs,
          (ref) => ref.where("admins", "array-contains", user.uid),
        ).snapshotChanges();
      }),
      map((items) => {
        return items
          .map((item) => {
            return {
              id: item.payload.doc.id,
              name: item.payload.doc.data().name,
            };
          })
          .sort((a, b) => a.name.localeCompare(b.name))
          ;
      }),
      takeUntil(this.destroyed$),
      shareReplay(),
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
