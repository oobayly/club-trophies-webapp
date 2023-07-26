import * as countries from "i18n-iso-countries";

export interface Country {
  iso3: string;
  name: string;
}

export const getCountries = (lang: string): Country[] => {
  return Object
    .entries(countries.getNames(lang))
    .map(([code, name]) => {
      return {
        iso3: countries.alpha2ToAlpha3(code),
        name,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    ;
}

export const loadCountries = (defaultLanguage = "en"): void => {
  // Use the current browser's language
  let language = navigator.language.split("-")[0];

  if (!countries.getSupportedLanguages().includes(language)) {
    language = defaultLanguage;
  }

  countries.registerLocale(require(`i18n-iso-countries/langs/${language}.json`));
}
