import { v4 } from "uuid";

export const truthy = (value: any): boolean => {
  if (typeof value === "string" && value.toLocaleLowerCase() === "false") {
    return false;
  }

  return !!value;
}

export const uuid = (): string => v4();
