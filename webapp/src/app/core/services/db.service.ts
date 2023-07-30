import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Boat, Collections } from "@models";
import { Observable, map, of, combineLatest } from "rxjs";
import { DbRecord, toRecord } from "../interfaces/DbRecord";

@Injectable({
  providedIn: "root",
})
export class DbService {
  // ========================
  // Properties
  // ========================

  // ========================
  // Lifecycle
  // ========================

  constructor(
    public readonly auth: AngularFireAuth,
    public readonly firestore: AngularFirestore,
  ) { }

  // ========================
  // Boats
  // ========================

  public getBoats(): Observable<DbRecord<Boat>[]>;
  public getBoats(clubId: string, excludePublic?: boolean): Observable<DbRecord<Boat>[]>;
  public getBoats(clubId?: string, excludePublic = false): Observable<DbRecord<Boat>[]> {
    let resp$: Observable<DbRecord<Boat>[]>;

    if (!clubId) {
      // All boats
      resp$ = this.firestore
        .collectionGroup<Boat>(Collections.Boats)
        .snapshotChanges()
        .pipe(
          map((x) => toRecord(x)),
        );
    } else {
      // For the specified club
      const forClub$ = this.firestore
        .collection(Collections.Clubs).doc(clubId)
        .collection<Boat>(Collections.Boats)
        .snapshotChanges().pipe(map((x) => toRecord(x)))
        ;
      let pub$: Observable<DbRecord<Boat>[]>;

      if (excludePublic) {
        pub$ = of([]);
      } else {
        pub$ = this.firestore
          .collection<Boat>(Collections.Boats)
          .snapshotChanges().pipe(map((x) => toRecord(x)))
      }

      resp$ = combineLatest([forClub$, pub$]).pipe(
        map(([forClub, pub]) => [...forClub, ...pub]),
      );
    }

    return resp$.pipe(map((items) => items.sort((a, b) => a.data.name.localeCompare(b.data.name))));
  }
}
