import { Pipe, PipeTransform } from "@angular/core";
import { Trophy } from "@models";

@Pipe({
  name: "donated",
  pure: true,
})
export class DonatedPipe implements PipeTransform {
  transform(value: Trophy, donorPrefix = "By", donatedPrefix = "In"): string {
    if (value.donor && value.donated) {
      return `${donorPrefix} ${value.donor} in ${value.donated}`;
    } else if (value.donor) {
      return `${donorPrefix} ${value.donor}`;
    } else if (value.donated) {
      return `${donatedPrefix} ${value.donated}`;
    }

    return "";
  }

}
