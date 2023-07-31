import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentChangeAction, QueryFn } from "@angular/fire/compat/firestore";
import { Boat, BoatReference, Club, Collections, DocumentRef, HasTimestamp, Search, SearchResult, SearchResultList, SearchWithResults, Trophy, TrophyFile, Winner } from "@models";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { Observable, map, firstValueFrom, combineLatest } from "rxjs";
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

  public getAllBoats(): Observable<DbRecord<Boat>[]> {
    return this.firestore.collectionGroup<Boat>(Collections.Boats)
      .snapshotChanges()
      .pipe(
        map((snapshot) => {
          return toRecord(snapshot)
            .sort((a, b) => a.data.name.localeCompare(b.data.name))
            ;
        }),
      );
  }

  public getBoats(clubId?: string): Observable<DbRecord<Boat>[]> {
    let resp$: Observable<DocumentChangeAction<Boat>[]>;

    if (!clubId) {
      // All boats
      resp$ = this.firestore
        .collection<Boat>(Collections.Boats)
        .snapshotChanges()
    } else {
      // For the specified club
      resp$ = this.firestore
        .collection(Collections.Clubs).doc(clubId)
        .collection<Boat>(Collections.Boats)
        .snapshotChanges()
        ;
    }

    return resp$.pipe(
      map((snapshot) => {
        return toRecord(snapshot)
          .sort((a, b) => a.data.name.localeCompare(b.data.name))
          ;
      }),
    );
  }

  public async addBoatRef<T extends { boatRef: string | null }>(value: T): Promise<T & BoatReference> {
    const { boatRef: refString } = value;
    let boatName: string | null = null;
    let boatRef: DocumentRef | null = null;

    if (refString) {
      const snapshot = await firstValueFrom(this.firestore.doc<Boat>(refString).get());

      if (snapshot.exists) {
        boatName = snapshot.data()!.name;
        boatRef = snapshot.ref;
      }
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

  // ========================
  // Searching
  // ========================

  public async createSearch(value: Omit<Search, "uid">): Promise<string> {
    const uid = (await this.auth.currentUser)?.uid || null;

    const doc = this.firestore.collection<Search>(Collections.Searches).doc();

    await doc.set({
      ...value,
      uid,
    });

    return doc.ref.id;
  }

  public getSearchResults(id: string): Observable<SearchWithResults | undefined> {
    const doc = this.firestore.collection<Search>(Collections.Searches).doc(id);

    return combineLatest([
      doc.snapshotChanges(),
      doc.collection<SearchResultList>(Collections.Results).snapshotChanges(),
    ]).pipe(
      map(([search, resultPages]) => {
        const results = resultPages.reduce((accum, item) => {
          accum.push(...item.payload.doc.data().results);

          return accum;
        }, [] as SearchResult[]);

        return {
          search: search.payload.data(),
          results,
        };
      }),
      map(({ search, results }) => {
        if (!search || !results) {
          return undefined;
        }

        return {
          ...search,
          results,
        };
      }),
    );
  }
}
