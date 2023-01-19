import { Action, DocumentChangeAction, DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "@angular/fire/compat/firestore";

export interface DbRecord<T = unknown> {
  id: string;
  // ref: firebase.default.firestore.DocumentReference<firebase.default.firestore.DocumentData | T>;
  data: T;
}

function toRecord<T = unknown>(value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>>): DbRecord<T | undefined>;
function toRecord<T = unknown>(value: DocumentChangeAction<T>[] | QueryDocumentSnapshot<T>[] | firebase.default.firestore.QuerySnapshot<T>): DbRecord<T>[];
function toRecord<T = unknown>(
  value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>> | DocumentChangeAction<T>[] | QueryDocumentSnapshot<T>[] | firebase.default.firestore.QuerySnapshot<T>
): DbRecord<T | undefined> | DbRecord<T>[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const doc = "payload" in item ? item.payload.doc : item;

      return {
        id: doc.id,
        // ref: doc.ref,
        data: doc.data()
      } as DbRecord<T>;
    });
  } else if ("docs" in value) {
    return value.docs.map((doc) => {
      return {
        id: doc.id,
        // ref: doc.ref,
        data: doc.data()
      } as DbRecord<T>;
    });
  } else if ("payload" in value) {
    const doc = value.payload;

    return {
      id: doc.id,
      // ref: doc.ref,
      data: doc.data()
    };
  } else {
    return {
      id: value.id,
      // ref: value.ref,
      data: value.data()
    };
  }
}

export {
  toRecord
}
