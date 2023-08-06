import { BoatReference } from "./Boat";
import { GenericKeyOf, NullableStringKeyOf } from "./types";

export const filterByNormalisedText = <T>(items: T[], text: string, ...fields: GenericKeyOf<T, string | undefined>[]): T[] => {
  text = text.toLocaleUpperCase();

  return items.filter((item) => {
    return fields.some((field) => {
      const val = (item[field] as unknown as string | undefined)?.toLocaleUpperCase();

      return val?.includes(text);
    })
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
