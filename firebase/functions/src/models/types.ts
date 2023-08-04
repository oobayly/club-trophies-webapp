/** A type that represents a key of T, but only for properties that are a nullable string. */
export type NullableStringKeyOf<T> = GenericKeyOf<T, string | null | undefined>;

/**
 * A type that represents a key of T, but only for properties of TProperty.
 * See https://stackoverflow.com/questions/60291002/can-typescript-restrict-keyof-to-a-list-of-properties-of-a-particular-type
 * */
export type GenericKeyOf<T, TProperty> = {
  [K in keyof T]: T[K] extends TProperty ? K : never;
}[keyof T];
