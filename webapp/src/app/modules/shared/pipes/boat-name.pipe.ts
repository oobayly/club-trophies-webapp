import { Pipe, PipeTransform } from "@angular/core";
import { BoatReference, Trophy } from "@models";

@Pipe({
  name: "boatName",
  pure: true,
})
export class BoatNamePipe implements PipeTransform {
  transform(value: Trophy | BoatReference): string {
    if ("boatName" in value) {
      return value.boatName || "";
    }

    return "";
  }
}
