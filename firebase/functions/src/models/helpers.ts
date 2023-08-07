import { BoatReference } from "./Boat";
import { GenericKeyOf, NullableStringKeyOf } from "./types";

/** Filters the list of items based on any of the specified fields containing text. */
function filterByNormalisedText<T>(items: T[], text: string, fields: GenericKeyOf<T, string | undefined>[]): T[];
/** Filters the list of items based on any of the specified fields provided in getItem containing text. */
function filterByNormalisedText<T, K>(items: T[], text: string, fields: GenericKeyOf<K, string | undefined>[], getItem: (item: T) => K): T[];
function filterByNormalisedText<T, K>(
  items: T[],
  text: string,
  fields: string[],
  getItem?: (item: T) => K,
): T[] {
  // This is a bit messy, but it means we don't have to re-normalised the search text every time
  // If no getItem is provided than the fields have to be in `T`
  // If getItem is provided, then the fields searched are in `K`
  text = text.toLocaleUpperCase();

  return items.filter((item) => {
    // We need to cast as any as the compiler has no idea of the type at this stage
    // The overloads mean we can't pass the wrong types in.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withFields: any = getItem ? getItem(item) : item;

    return fields.some((field) => {
      const val = (withFields[field] as string | undefined)?.toLocaleUpperCase();

      return val?.includes(text);
    });
  });
}

export const getBoatNames = (items: BoatReference[]): string[] => {
  return items
    .reduce((accum, item) => {
      const { boatName } = item;

      if (boatName && !accum.includes(boatName)) {
        accum.push(boatName);
      }

      return accum;
    }, [] as string[])
    .sort()
    ;
}

/** Remove all string that are empty or null from the specified item. */
export const removeEmptyStrings = <T>(item: T, keys: NullableStringKeyOf<T> | NullableStringKeyOf<T>[]): T => {
  return removeMatching(item, keys, (value) => {
    if (value == null) {
      return true;
    } else if (typeof value === "string") {
      if (!value.trim()) {
        return true;
      }
    }

    return false;
  });
};

export const removeMatching = <T, TProperty>(
  item: T,
  keys: GenericKeyOf<T, TProperty> | GenericKeyOf<T, TProperty>[],
  canRemove: (value: T[GenericKeyOf<T, TProperty>]) => boolean
): T => {
  if (!Array.isArray(keys)) {
    keys = [keys];
  }

  keys.forEach((key) => {
    if (canRemove(item[key])) {
      delete item[key];
    }
  });

  return item;
};

export {
  filterByNormalisedText,
};
