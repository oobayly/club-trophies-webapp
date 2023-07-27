import { AngularFirestore, AngularFirestoreDocument } from "@angular/fire/compat/firestore";
import { Club, Collections, Trophy } from "@models";

interface ClubComponent {
  clubId: string | null | undefined;
}

interface TrophyComponent extends ClubComponent {
  trophyId: string | null | undefined;
}

export const truthy = (value: any): boolean => {
  if (typeof value === "string" && value.toLocaleLowerCase() === "false") {
    return false;
  }

  return !!value;
}

export const getClubReference = (db: AngularFirestore, component: ClubComponent): AngularFirestoreDocument<Club> | undefined => {
  if (!component.clubId) {
    return undefined;
  }

  return db.collection<Club>(Collections.Clubs).doc(component.clubId);
}

export const getTrophyReference = (db: AngularFirestore, component: TrophyComponent): AngularFirestoreDocument<Trophy> | undefined => {
  if (!component.trophyId) {
    return undefined;
  }

  return getClubReference(db, component)?.collection<Trophy>(Collections.Trophies).doc(component.trophyId);
}
