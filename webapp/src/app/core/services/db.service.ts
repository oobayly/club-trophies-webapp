import { Injectable } from "@angular/core";
import { Auth } from "@angular/fire/auth";
import { CollectionReference, DocumentReference, DocumentSnapshot, Firestore, Query, UpdateData, addDoc, collection, collectionGroup, collectionSnapshots, docSnapshots, getDoc, serverTimestamp, updateDoc } from "@angular/fire/firestore";
import { Boat, BoatReference, Club, ClubLogoRequest, Collections, HasTimestamp, Search, SearchResult, SearchResultList, SearchWithResults, Trophy, TrophyFile, Winner } from "@models";
import { Observable, map, combineLatest, switchMap, of, filter } from "rxjs";
import { DbRecord, toRecord } from "../interfaces/DbRecord";
import { WithFieldValue, doc } from "firebase/firestore";

type TimestampProps = "created" | "modified";

export function typedCollection<T>(firstore: Firestore, path: string[]): CollectionReference<T>;
export function typedCollection<T>(firstore: Firestore, path: string, ...pathSegments: string[]): CollectionReference<T>;
export function typedCollection<T>(firstore: Firestore, path: string | string[], ...pathSegments: string[]): CollectionReference<T> {
  if (Array.isArray(path)) {
    pathSegments = path.slice(1);
    path = path[0];
  }

  return collection(firstore, path, ...pathSegments) as CollectionReference<T>;
}

const getClubsPath = (): string[] => [Collections.Clubs];

const getLogosPath = (clubId: string): string[] => [...getClubsPath(), clubId, Collections.Logos];

const getBoatsPath = (clubId?: string): string[] => {
  if (clubId) {
    return [...getClubsPath(), clubId, Collections.Boats];
  } else {
    return [Collections.Boats];
  }
}

const getTrophiesPath = (clubId: string): string[] => [...getClubsPath(), clubId, Collections.Trophies];

const getTrophyFilesPath = (clubid: string, trophyId: string): string[] => [...getTrophiesPath(clubid), trophyId, Collections.Files];

const getWinnersPath = (clubid: string, trophyId: string): string[] => [...getTrophiesPath(clubid), trophyId, Collections.Winners];

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
    public readonly auth: Auth,
    public readonly firestore: Firestore,
  ) { }

  // ========================
  // Methods
  // ========================

  public async addRecord<T extends HasTimestamp>(collection: CollectionReference<T>, value: Omit<WithFieldValue<T>, TimestampProps>): Promise<DocumentReference<T>> {
    const docRef = await addDoc(collection, {
      ...value,
      created: serverTimestamp(),
    } as T);

    return docRef;
  }

  public async updateRecord<T extends HasTimestamp>(doc: DocumentReference<T>, value: Omit<UpdateData<T>, TimestampProps>): Promise<string> {
    await updateDoc(doc, {
      ...value,
      modified: serverTimestamp(),
    } as UpdateData<T>);

    return doc.id;
  }

  // ========================
  // Boats
  // ========================

  public getAllBoats(): Observable<DbRecord<Boat>[]> {
    const query = collectionGroup(this.firestore, Collections.Boats) as Query<Boat>;

    return collectionSnapshots(query).pipe(
      map((x) => toRecord(x)),
    );
  }

  public getBoats(clubId?: string): Observable<DbRecord<Boat>[]> {
    const query = typedCollection<Boat>(this.firestore, getBoatsPath(clubId));

    return collectionSnapshots(query).pipe(
      map((x) => toRecord(x).sort((a, b) => a.data.name.localeCompare(b.data.name))),
    );
  }

  /** Add the boat reference properties to the current object, returning a new object */
  public async withBoatRef<T extends { boatRef?: string | null }>(value: T): Promise<Omit<T, "boatRef"> & BoatReference> {
    const { boatRef: refString, ...result } = value;

    if (refString) {
      const snapshot = (await getDoc(doc(this.firestore, refString))) as DocumentSnapshot<Boat>;

      if (snapshot.exists()) {
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

  public getClubsCollection(): CollectionReference<Club> {
    return typedCollection<Club>(this.firestore, getClubsPath());
  }

  public getClubDoc(clubId: string): DocumentReference<Club> {
    return doc(this.getClubsCollection(), clubId);
  };

  public getClubLogosCollection(clubId: string): CollectionReference<ClubLogoRequest> {
    return typedCollection<Club>(this.firestore, getLogosPath(clubId));
  }

  public async addClub(club: Omit<Club, "admins" | TimestampProps>): Promise<string> {
    const uid = this.auth.currentUser?.uid;

    if (!uid) {
      throw "Not signed in.";
    }

    const docRef = await this.addRecord(
      this.getClubsCollection(),
      {
        ...club,
        admins: [uid],
      },
    );

    return docRef.id;
  }

  // ========================
  // Trophies
  // ========================

  public getTrophyCollection(clubId: string): CollectionReference<Trophy> {
    return typedCollection(this.firestore, getTrophiesPath(clubId));
  }

  public getTrophyDoc(clubId: string, trophyId: string): DocumentReference<Trophy> {
    return doc(this.getTrophyCollection(clubId), trophyId);
  };

  // ========================
  // Files
  // ========================

  public getFilesCollection(clubId: string, trophyId: string): CollectionReference<TrophyFile> {
    return typedCollection(this.firestore, getTrophyFilesPath(clubId, trophyId));
  }

  public getFileDoc(clubId: string, trophyId: string, fileId: string): DocumentReference<TrophyFile> {
    return doc(this.getFilesCollection(clubId, trophyId), fileId);
  };

  // ========================
  // Winners
  // ========================

  public getWinnersCollection(clubId: string, trophyId: string): CollectionReference<Winner> {
    return typedCollection(this.firestore, getWinnersPath(clubId, trophyId));
  }

  public getWinnerDoc(clubId: string, trophyId: string, winnerId: string): DocumentReference<Winner> {
    return doc(this.getWinnersCollection(clubId, trophyId), winnerId);
  };

  // ========================
  // Searching
  // ========================

  public getSearchDocument(searchId: string): DocumentReference<Search> {
    return doc(typedCollection<Search>(this.firestore, Collections.Searches), searchId);
  }

  public async createSearch(value: Omit<Search, "uid">): Promise<string> {
    const uid = this.auth.currentUser?.uid;

    const docRef = await addDoc(
      typedCollection<Search>(this.firestore, Collections.Searches),
      {
        ...value,
        ...uid ? { uid } : undefined,
      });

    return docRef.id;
  }

  public getSearchResults(id: string): Observable<SearchWithResults> {
    const docRef = this.getSearchDocument(id);

    return docSnapshots(docRef).pipe(
      map((x) => x.data()),
      // Wait until the clubs property is populated
      filter((x): x is Search => !!x?.clubs),
      // Once we have a populates search, get the pages
      switchMap((search) => {
        const resultsColl = collection(docRef, Collections.SearchResults) as CollectionReference<SearchResultList>;

        return combineLatest([
          of(search),
          collectionSnapshots(resultsColl),
        ])
      }),
      // And wait until we have at least one page
      filter(([_, pages]) => !!pages.length),
      // And combine into a valid search result
      map(([search, pages]) => {
        const results = pages.reduce((accum, item) => {
          accum.push(...item.data().results);

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
