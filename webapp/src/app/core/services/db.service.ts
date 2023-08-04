import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument, DocumentChangeAction, QueryFn } from "@angular/fire/compat/firestore";
import { Boat, BoatReference, Club, ClubLogoRequest, Collections, HasTimestamp, Search, SearchResult, SearchResultList, SearchWithResults, Trophy, TrophyFile, Winner } from "@models";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { Observable, map, firstValueFrom, combineLatest, switchMap, of, filter } from "rxjs";
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

  /** Add the boat reference properties to the current object, returning a new object */
  public async withBoatRef<T extends { boatRef?: string | null }>(value: T): Promise<Omit<T, "boatRef"> & BoatReference> {
    const { boatRef: refString, ...result } = value;

    if (refString) {
      const snapshot = await firstValueFrom(this.firestore.doc<Boat>(refString).get());

      if (snapshot.exists) {
        return {
          ...result,
          boatName: snapshot.data()!.name,
          boatRef: snapshot.ref,
        }
      }
    }

    return result;
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

  public getClubLogoDoc(clubId: string): AngularFirestoreDocument<ClubLogoRequest> {
    return this.getClubDoc(clubId).collection<ClubLogoRequest>(Collections.Logos).doc();
  }

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
    const uid = (await this.auth.currentUser)?.uid;
    const docRef = this.firestore.collection<Search>(Collections.Searches).doc();

    await docRef.set({
      ...value,
      uid,
    });

    return docRef.ref.id;
  }

  public getSearchResults(id: string): Observable<SearchWithResults> {
    const docRef = this.firestore.collection<Search>(Collections.Searches).doc(id);

    return docRef.snapshotChanges().pipe(
      map((snapshot) => {
        // Check here if the search exits and throw so we don't try getting the result pagess
        if (!snapshot.payload.exists) {
          throw new Error("Search not found");
        }

        return snapshot.payload.data();
      }),
      // Wait until the clubs property is populated
      filter((x) => !!x.clubs),
      // Once we have a populates search, get the pages
      switchMap((search) => {
        return combineLatest([
          of(search),
          docRef.collection<SearchResultList>(Collections.SearchResults).snapshotChanges(),
        ]);
      }),
      // And wait until we have at least one page
      filter(([_, pages]) => !!pages.length),
      // And combine into a valid search result
      map(([search, pages]) => {
        const results = pages.reduce((accum, item) => {
          accum.push(...item.payload.doc.data().results);

          return accum;
        }, [] as SearchResult[]);

        return {
          ...search,
          clubs: search.clubs!, // From the filter, we know the clubs value is valid
          results,
        };
      }),
    );
  }
}
