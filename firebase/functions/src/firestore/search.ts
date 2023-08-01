import * as admin from "firebase-admin";
import { Club, Collections, Search, SearchClubInfo, SearchResult, SearchResultList, SearchTrophyInfo, Trophy, Winner } from "../models"


const batchRequests = async (
  collection: admin.firestore.CollectionReference<admin.firestore.DocumentData>, ids: string[]
): Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>[]> => {
  const snapshots: Promise<admin.firestore.QuerySnapshot<admin.firestore.DocumentData>>[] = [];
  const batchSize = 10;

  // So we don't modified the original array
  ids = [...ids];

  // Batch into groups of 10 so we can leverage "in"
  do {
    const batchIds = ids.splice(0, batchSize);

    if (batchIds.length) {
      snapshots.push(collection.where(admin.firestore.FieldPath.documentId(), "in", batchIds).get());
    }
  } while (ids.length);

  return await Promise.all(snapshots);
}

const getClubIds = (winners: Winner[]): string[] => {
  return winners
    .reduce((accum, item) => {
      const { clubId } = item.parent;

      if (!accum.includes(clubId)) {
        accum.push(clubId);
      }

      return accum;
    }, [] as string[])
    ;
}

const getClubTrophyIds = (clubId: string, winners: Winner[]): string[] => {
  return winners
    .filter((x) => x.parent.clubId === clubId)
    .reduce((accum, item) => {
      const { trophyId } = item.parent;

      if (!accum.includes(trophyId)) {
        accum.push(trophyId);
      }

      return accum;
    }, [] as string[])
    ;
}

const getClubs = async (uid: string | null, clubIds: string[]): Promise<SearchClubInfo[]> => {
  const list: SearchClubInfo[] = [];

  const snapshots = await batchRequests(
    admin.firestore().collection(Collections.Clubs),
    clubIds
  );

  // Combine all the snapshots
  snapshots.forEach((snapshot) => {
    // Filtering those that the user is allowed to view
    // They must be public, or the user has to be an admin
    snapshot.forEach((item) => {
      const club = item.data() as Club;
      const isAdmin = club.admins.includes(uid || "");
      const canView = isAdmin || club.public;

      if (canView) {
        list.push({
          clubId: item.id,
          name: club.name,
          isAdmin,
          trophies: [],
        })
      }
    });
  });

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

const getClubTrophies = async (info: SearchClubInfo, winners: Winner[]): Promise<SearchTrophyInfo[]> => {
  const { clubId } = info;
  const trophyIds = getClubTrophyIds(clubId, winners);
  const list: SearchTrophyInfo[] = [];

  const snapshots = await batchRequests(
    admin.firestore().collection(Collections.Clubs).doc(clubId).collection(Collections.Trophies),
    trophyIds
  );

  // Combine all the snapshots
  snapshots.forEach((snapshot) => {
    // Filtering those that the user is allowed to view
    // They must be public, or the user has to be an admin
    snapshot.docs.forEach((item) => {
      const trophy = item.data() as Trophy;
      const canView = info.isAdmin || trophy.public;

      if (canView) {
        list.push({
          trophyId: item.id,
          name: trophy.name,
        });
      }
    });
  });

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

const getSearchClubInfo = async (uid: string | null, winners: Winner[]): Promise<SearchClubInfo[]> => {
  const clubIds = getClubIds(winners);
  const list = await getClubs(uid, clubIds);

  for (let i = 0; i < list.length; i++) {
    const item = list[i];

    item.trophies = await getClubTrophies(item, winners);
    delete item.isAdmin; // This is no longer needed
  }

  return list;
}

const getWinners = async (search: Search): Promise<Winner[]> => {
  const query = admin.firestore().collectionGroup(Collections.Winners) as unknown as admin.firestore.Query<Winner>;

  if (search.boatName) {
    query.where("boatName", "==", search.boatName);
  }
  if (search.clubId) {
    query.where("parent.clubId", "==", search.clubId);
  }

  const snapshot = await query.get();

  return snapshot.docs.map((x) => x.data());
}

const batchSearchResults = (batch: admin.firestore.WriteBatch, parent: admin.firestore.DocumentReference, results: SearchResult[]): void => {
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
}

export const search = async (doc: admin.firestore.DocumentSnapshot): Promise<void> => {
  const winners = await getWinners(doc.data() as Search);
  const search = doc.data() as Search;
  const clubs = await getSearchClubInfo(search.uid, winners);
  const expireAfter = new Date(Date.now() + 86400000); // Expire after 1 day

  const results = winners
    .reduce((accum, item) => {
      const { clubId, trophyId } = item.parent;

      // Only return items that are in the club info list
      const info = clubs.find((x) => x.clubId === clubId);
      const canView = !!info && info.trophies.some((x) => x.trophyId === trophyId);

      if (canView) {
        const { year, sail, helm, crew, owner, name, boatName, club } = item;

        accum.push({
          year,
          sail,
          helm,
          crew,
          owner,
          name,
          boatName,
          club,
          parent: { clubId, trophyId },
        })
      }

      return accum;
    }, [] as SearchResult[])

  // Batch up all our writes as there may be multiple pages
  const batch = doc.ref.firestore.batch();

  batch.update(doc.ref, {
    expireAfter,
    clubs,
  });

  batchSearchResults(batch, doc.ref, results);

  await batch.commit();
}
