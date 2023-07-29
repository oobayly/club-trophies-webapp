import { Pipe, PipeTransform } from "@angular/core";
import { Trophy } from "@models";

@Pipe({
  name: "donated",
  pure: true,
})
export class DonatedPipe implements PipeTransform {
  transform(value: Trophy): string {
    if (value.donor && value.donated) {
      return `${value.donor} in ${value.donated}`;
    } else if (value.donated) {
      return value.donated;
    } else if (value.donor) {
      return value.donor;
    }

    return "";
  }

}
