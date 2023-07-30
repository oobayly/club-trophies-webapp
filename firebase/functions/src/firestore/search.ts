import * as admin from "firebase-admin";
import { Club, Collections, Search, SearchResult, SearchResultList, Trophy, Winner } from "../models"

type ItemMap<T> = { [key: string]: T };

const getWinners = async (search: Search): Promise<Winner[]> => {
  const query = admin.firestore().collectionGroup(Collections.Winners) as unknown as admin.firestore.Query<Winner>;

  if (search.boatName) {
    query.where("boatName", "==", search.boatName);
  }
  if (search.clubId) {
    query.where("clubId", "==", search.clubId);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((x) => x.data());
}

const getNames = async <T>(winners: Winner[], selector: (item: Winner) => string, getName: (item: T) => string): Promise<ItemMap<string>> => {
  const db = admin.firestore();
  const queries = winners
    .reduce((accum, item) => {
      const path = selector(item);

      if (!accum.includes(path)) {
        accum.push(path);
      }

      return accum;
    }, [] as string[])
    .map((path) => db.doc(path).get())
    ;

  return (await Promise.all(queries))
    .reduce((accum, item) => {
      accum[item.id] = getName(item.data() as T);

      return accum;
    }, {} as ItemMap<string>);

}

const saveResults = async (parent: admin.firestore.DocumentReference, results: SearchResult[]): Promise<void> => {
  const batch = parent.firestore.batch();
  const batchSize = 100;

  // Group into batches, to avoid the 1MB document limit
  let page = 0;
  do {
    const ref = parent.collection(Collections.Results).doc();
    const list: SearchResultList = {
      page: page++,
      expireAfter: new Date(Date.now() + 86400000), // Expire after 1 day
      results: results.splice(0, batchSize),
    };

    batch.set(ref, list);
  } while (results.length);

  await batch.commit();
}

export const search = async (doc: admin.firestore.DocumentSnapshot): Promise<void> => {
  const winners = await getWinners(doc.data() as Search);
  const clubNames = await getNames<Club>(
    winners,
    (item) => `${Collections.Clubs}/${item.clubId}`,
    (item) => item.name
  );
  const trophyNames = await getNames<Trophy>(
    winners,
    (item) => `${Collections.Clubs}/${item.clubId}/${Collections.Trophies}/${item.trophyId}`,
    (item) => item.name
  );
  const expireAfter = new Date(Date.now() + 86400000); // Expire after 1 day

  const results = winners.map((item): SearchResult => {
    const { year, sail, helm, crew, owner, name, boatName, club, clubId, trophyId } = item;

    return {
      year,
      sail,
      helm,
      crew,
      owner,
      name,
      boatName,
      club,
      clubId,
      trophyId,
      clubName: clubNames[item.clubId],
      trophyName: trophyNames[item.trophyId],
    }
  });

  await Promise.all([
    saveResults(doc.ref, results),
    doc.ref.update({ expireAfter }),
  ]);
}
