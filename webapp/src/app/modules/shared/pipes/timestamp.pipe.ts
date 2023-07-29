import { Pipe, PipeTransform } from "@angular/core";
import { TimestampType } from "@models";

@Pipe({
  name: "timestamp",
  pure: true,
})
export class TimestampPipe implements PipeTransform {

  transform(value: TimestampType | null | undefined, includeTime?: boolean): string;
  transform(value: TimestampType | null | undefined, format?: Intl.DateTimeFormatOptions): string;
  transform(value: TimestampType | null | undefined, format?: boolean | Intl.DateTimeFormatOptions): string {
    if (value && "toDate" in value) {
      if (!format) {
        format = false;
      }

      const d = value.toDate() as Date;

      if (typeof format === "boolean") {
        const datePart = d.toLocaleDateString(navigator.language);

        if (format) {
          return `${datePart} ${d.toLocaleTimeString(navigator.language)}`;
        } else {
          return datePart;
        }
      } else {
        return d.toLocaleString(navigator.language, format);
      }
    }

    return "n/a";
  }
}
