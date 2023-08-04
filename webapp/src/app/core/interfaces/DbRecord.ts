import { DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "@angular/fire/firestore";

export interface DbRecord<T = unknown> {
  id: string;
  ref: string;
  data: T;
  // TODO: Check whether we can access these using a new version of AngularFire  
  // created?: Date;
  // modified?: Date;
}

export interface CanEditDbRecord<T = unknown> extends DbRecord<T> {
  canEdit: boolean;
}

function toCanEditRecord<TRecord extends { admins: string[] }>(
  values: DbRecord<TRecord>[], uid: string | null | undefined, isAdmin?: boolean,
): CanEditDbRecord<TRecord>[] {
  return values.map((item) => {
    return {
      ...item,
      canEdit: isAdmin || (!!uid && item.data.admins.includes(uid)),
    };
  });
}

function toRecord<T = unknown>(value: DocumentSnapshot<T>): DbRecord<T | undefined>;
function toRecord<T = unknown>(value: QueryDocumentSnapshot<T>[] | QuerySnapshot<T>): DbRecord<T>[];
function toRecord<T = unknown>(value: QueryDocumentSnapshot<T>[] | QuerySnapshot<T> | DocumentSnapshot<T>): DbRecord<T>[] | DbRecord<T | undefined> {
  if (Array.isArray(value)) {
    // QueryDocumentSnapshot[]
    return value.map((item) => {
      return {
        id: item.id,
        data: item.data(),
        ref: item.ref.path,
      };
    });
  } else if ("docs" in value) {
    // QuerySnapshot
    return value.docs.map((item) => {
      return {
        id: item.id,
        data: item.data(),
        ref: item.ref.path,
      };
    });
  } else if ("payload" in value) {
    throw new Error("Not supported");
  } else {
    // DocumentSnapshot
    return {
      id: value.id,
      data: value.data(),
      ref: value.ref.path,
    };
  }

  return [];
}

export {
  toCanEditRecord,
  toRecord,
}
