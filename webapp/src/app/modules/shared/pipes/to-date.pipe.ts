import { Pipe, PipeTransform } from "@angular/core";
import { TimestampType } from "@models";

@Pipe({
  name: "toDate",
  pure: true,
})
export class ToDatePipe implements PipeTransform {

  transform(value: TimestampType): Date | undefined {
    if (typeof value === "number") {
      return new Date(value);
    } else if ("toDate" in value) {
      return value.toDate();
    }

    return undefined;
  }

}
