import { Action, DocumentChangeAction, DocumentSnapshot, QueryDocumentSnapshot } from "@angular/fire/compat/firestore";

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

function toRecord<T = unknown>(value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>>): DbRecord<T | undefined>;
function toRecord<T = unknown>(value: DocumentChangeAction<T>[] | QueryDocumentSnapshot<T>[] | firebase.default.firestore.QuerySnapshot<T>): DbRecord<T>[];
function toRecord<T = unknown>(
  value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>> | DocumentChangeAction<T>[] | QueryDocumentSnapshot<T>[] | firebase.default.firestore.QuerySnapshot<T>,
): DbRecord<T | undefined> | DbRecord<T>[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const doc = "payload" in item ? item.payload.doc : item;

      return {
        id: doc.id,
        ref: doc.ref.path,
        data: doc.data(),
      } as DbRecord<T>;
    });
  } else if ("docs" in value) {
    return value.docs.map((doc) => {
      return {
        id: doc.id,
        ref: doc.ref.path,
        data: doc.data(),
      } as DbRecord<T>;
    });
  } else if ("payload" in value) {
    const doc = value.payload;

    return {
      id: doc.id,
      ref: doc.ref.path,
      data: doc.data(),
    };
  } else {
    return {
      id: value.id,
      ref: value.ref.path,
      data: value.data(),
    };
  }
}

export {
  toCanEditRecord,
  toRecord,
}
