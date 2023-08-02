import { Pipe, PipeTransform } from "@angular/core";
import { alpha3ToAlpha2 } from "i18n-iso-countries";

type CountryType = { country: string } | string | null | undefined;

@Pipe({
  name: "flag",
  pure: true,
})
export class FlagPipe implements PipeTransform {
  transform(country: CountryType): string {
    if (!country) {
      return "";
    }

    let alpha2: string | undefined;

    if (typeof country === "string") {
    } else if (country && "country" in country) {
      country = country.country;
    }

    if (country?.length === 2) {
      alpha2 = country;
    } else if (country?.length === 3) {
      alpha2 = alpha3ToAlpha2(country);
    }

    if (alpha2) {
      return `fi-${alpha2.toLocaleLowerCase()}`;
    }

    return "";
  }

}
