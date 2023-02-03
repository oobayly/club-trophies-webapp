import { Component, OnDestroy, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { catchError, combineLatest, distinctUntilChanged, first, map, Observable, of, shareReplay, Subject, switchMap, takeUntil } from "rxjs";
import { Club, Collections } from "@models";
import { DbRecord, toRecord } from "./core/interfaces/DbRecord";
import { isAdmin } from "./core/helpers/auth";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"],
})
export class AppComponent implements OnDestroy, OnInit {
  public email?: string = undefined;

  public readonly user$ = this.auth.user;
  public readonly claims$ = this.auth.idTokenResult.pipe(map((x) => x?.claims));
  public readonly clubs$: Observable<DbRecord<Club>[]>;

  private readonly destroyed$ = new Subject<void>();

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    this.auth.user.subscribe((user) => console.log(user));

    this.clubs$ = this.auth.idTokenResult.pipe(
      distinctUntilChanged((p, c) => {
        return p?.issuedAtTime === c?.issuedAtTime;
      }),
      switchMap((idToken) => {
        if (isAdmin(idToken)) {
          return this.db.collection<Club>(Collections.Clubs).snapshotChanges();
        } else if (idToken) {
          const uid = idToken.claims["sub"];
          const other$ = this.db.collection<Club>(
            Collections.Clubs,
            (ref) => ref.where("public", "==", true),
          ).snapshotChanges();
          const mine$ = this.db.collection<Club>(
            Collections.Clubs,
            (ref) => ref.where("public", "!=", true).where("admins", "array-contains", uid),
          ).snapshotChanges();

          return combineLatest([other$, mine$]).pipe(
            map(([other, mine]) => {
              const list = other.map((x) => x.payload.doc);

              mine.forEach((x) => {
                const { doc } = x.payload;
                const exists = list.some((existing) => existing.id === doc.id);

                if (!exists) {
                  list.push(doc);
                }
              })

              return list;
            }),
          );
        } else {
          return this.db.collection<Club>(
            Collections.Clubs,
            (ref) => ref.where("public", "==", true),
          ).snapshotChanges();
        }
      }),
      takeUntil(this.destroyed$),
      map((items) => toRecord(items)),
      shareReplay(),
    );

    // auth.signOut();
    // auth.signInWithEmailAndPassword("ldyc@nothing.com", "Password");

    this.db.collection<Club>(Collections.Clubs).doc("abc").get().pipe(
      catchError((e) => {
        console.log(e);

        return of(undefined);
      }),
    ).subscribe((x) => {
      console.log(x);
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  ngOnInit(): void {
    this.auth.user.pipe(
      first(),
      map((u) => u?.email),
    ).subscribe((email) => this.email = email || undefined);
  }

  public async onEmailChange(email: string | undefined): Promise<void> {
    if (email) {
      const current = await this.auth.currentUser;

      if (email !== current?.email) {
        await this.auth.signInWithEmailAndPassword(email, "Password");
      }

    } else {
      await this.auth.signOut();
    }

    // console.log(e);
  }
}
