import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { catchError, distinct, distinctUntilChanged, filter, map, of, retry, switchMap, tap } from "rxjs";
import { Club } from "@models";
import { toRecord } from "./core/interfaces/DbRecord";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public user$ = this.auth.user;
  public claims$ = this.auth.idTokenResult.pipe(map((x) => x?.claims));

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
  ) {
    this.auth.user.subscribe((user) => console.log(user));
    // auth.signOut();
    // db.collection("clubs").get()
    //   .pipe(
    //     catchError((e, caught) => {
    //       console.log(e, caught);
    //       return of();
    //     })
    //   )
    //   .subscribe();
    // auth.signInWithEmailAndPassword("nobody@nothing.com", "Password");
  }

  ngOnInit(): void {
    this.auth.user.pipe(
      // filter((u) => !!u),
      map((u) => u?.uid),
      // tap((u) => console.log(u)),
      distinct(),
      switchMap(() => {
        return this.db
          .collection<Club>(
            "clubs",
            (ref) => ref.where("public", "==", true)
          )
          // .doc("").get() // firebase.firestore.DocumentSnapshot<Club> // data()
          // .doc("").snapshotChanges() // Action<DocumentSnapshot<Club>> // payload.data()
          .get() // firebase.firestore.QuerySnapshot<Club> // docs[].data()
        // .snapshotChanges() // DocumentChangeAction<Club>[] // [].payload.data()
        // .valueChanges()
      }),
      tap((x) => {
        // const foo = x.data()
        // const foo = x.payload.data()
        const foo = x.docs[0].data()
        // const foo = x[0].payload.doc.data();
      }),
      map((x) => toRecord(x))
    ).subscribe((snapshot) => {
      console.log(snapshot);
    });
  }
}
