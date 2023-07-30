import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, QueryFn } from "@angular/fire/compat/firestore";
import { Boat, BoatReference, Club, Collections, DocumentRef, HasTimestamp, Search, SearchResult, SearchResultList, Trophy, TrophyFile, Winner } from "@models";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { Observable, map, of, combineLatest, firstValueFrom, switchMap } from "rxjs";
import { DbRecord, toRecord } from "../interfaces/DbRecord";

type TimestampProps = "created" | "modified";

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
  // Methods
  // ========================

  public async addRecord<T extends HasTimestamp>(doc: AngularFirestoreDocument<T>, value: Omit<T, TimestampProps>): Promise<string> {
    await doc.set({
      ...value,
      created: firebase.firestore.Timestamp.now(),
      modified: null,
    } as T);

    return doc.ref.id;
  }

  public async updateRecord<T extends HasTimestamp>(doc: AngularFirestoreDocument<T>, value: Partial<Omit<T, TimestampProps>>): Promise<string> {
    await doc.update({
      ...value,
      modified: firebase.firestore.Timestamp.now(),
    } as T);

    return doc.ref.id;
  }

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

  public async addBoatRef<T extends { boatRef: string | null }>(value: T, boats$?: Observable<DbRecord<Boat>[]>): Promise<T & BoatReference> {
    const { boatRef: refString } = value;
    let boatName: string | null;
    let boatRef: DocumentRef | null;

    if (refString && boats$) {
      const found = (await firstValueFrom(boats$)).find((x) => x.ref === refString);

      if (!found) {
        throw new Error("No boat found.");
      }

      boatName = found.data.name;
      boatRef = this.firestore.doc(refString).ref;
    } else {
      boatName = null;
      boatRef = null;
    }

    return {
      ...value,
      boatName,
      boatRef,
    };
  }

  // ========================
  // Clubs
  // ========================

  public getClubsCollection(queryFn?: QueryFn): AngularFirestoreCollection<Club> {
    return this.firestore.collection<Club>(Collections.Clubs, queryFn);
  }

  public getClubDoc(clubId?: string | null): AngularFirestoreDocument<Club> {
    return this.getClubsCollection().doc(clubId || undefined);
  };

  public async addClub(club: Omit<Club, "admins" | TimestampProps>, admins?: string[]): Promise<string> {
    if (!admins?.length) {
      const uid = (await this.auth.currentUser)?.uid;

      if (!uid) {
        throw "Not signed in.";
      }

      admins = [uid];
    }

    return await this.addRecord(
      this.getClubDoc(),
      {
        ...club,
        admins,
      },
    )
  }

  // ========================
  // Trophies
  // ========================

  public getTrophyCollection(clubId: string, queryFn?: QueryFn): AngularFirestoreCollection<Trophy> {
    return this.getClubDoc(clubId).collection<Trophy>(Collections.Trophies, queryFn);
  }

  public getTrophyDoc(clubId: string, trophyId?: string | null): AngularFirestoreDocument<Trophy> {
    return this.getTrophyCollection(clubId).doc(trophyId || undefined);
  };

  // ========================
  // Files
  // ========================

  public getFilesCollection(clubId: string, trophyId: string, queryFn?: QueryFn): AngularFirestoreCollection<TrophyFile> {
    return this.getTrophyDoc(clubId, trophyId).collection<TrophyFile>(Collections.Files, queryFn);
  }

  public getFileDoc(clubId: string, trophyId: string, fileId?: string | null): AngularFirestoreDocument<TrophyFile> {
    return this.getFilesCollection(clubId, trophyId).doc(fileId || undefined);
  };

  // ========================
  // Winners
  // ========================

  public getWinnersCollection(clubId: string, trophyId: string, queryFn?: QueryFn): AngularFirestoreCollection<Winner> {
    return this.getTrophyDoc(clubId, trophyId).collection<Winner>(Collections.Winners, queryFn);
  }

  public getWinnerDoc(clubId: string, trophyId: string, winnerId?: string | null): AngularFirestoreDocument<Winner> {
    return this.getWinnersCollection(clubId, trophyId).doc(winnerId || undefined);
  };

  public searchWinners(value: Omit<Search, "uid">): Observable<SearchResult[]> {
    const searchDoc = this.firestore.collection<Search>(Collections.Searches).doc();

    return this.auth.user.pipe(
      switchMap(async (user) => {
        await searchDoc.set({
          ...value,
          uid: user?.uid || null,
        });
      }),
      switchMap(() => {
        return searchDoc.collection<SearchResultList>(Collections.Results).snapshotChanges();
      }),
      map((snapshot) => {
        return toRecord(snapshot)
          .reduce((accum, item) => {
            accum.push(...item.data.results);

            return accum;
          }, [] as SearchResult[])
          .sort((a, b) => {
            let resp = a.clubName.localeCompare(b.clubName);

            if (resp !== 0) {
              return resp;
            }

            return b.year - a.year;
          })
          ;
      }),
    );
  }
}
