import { Action, DocumentChangeAction, DocumentSnapshot, QueryDocumentSnapshot, QuerySnapshot } from "@angular/fire/compat/firestore";

export interface DbRecord<T = unknown> {
  id: string;
  ref: firebase.default.firestore.DocumentReference<firebase.default.firestore.DocumentData | T>;
  data: T;
}

function toRecord<T = unknown>(value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>>): DbRecord<T | undefined>;
function toRecord<T = unknown>(value: DocumentChangeAction<T>[] | firebase.default.firestore.QuerySnapshot<T>): DbRecord<T>[];
function toRecord<T = unknown>(
  value: firebase.default.firestore.DocumentSnapshot<T> | Action<DocumentSnapshot<T>> | DocumentChangeAction<T>[] | firebase.default.firestore.QuerySnapshot<T>
): DbRecord<T | undefined> | DbRecord<T>[] {
  if (Array.isArray(value)) {
    return value.map((item) => {
      const { id, ref, data } = item.payload.doc;

      return { id, ref, data: data() };
    });
  } else if ("docs" in value) {
    return value.docs.map((item) => {
      const { id, ref, data } = item;

      return { id, ref, data: data() };
    });
  } else if ("payload" in value) {
    const { id, ref, data } = value.payload;

    return { id, ref, data: data() };
  } else {
    const { id, ref, data } = value;

    return { id, ref, data: data() };
  }
}

export {
  toRecord
}
