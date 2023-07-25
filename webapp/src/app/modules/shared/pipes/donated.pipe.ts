import { Pipe, PipeTransform } from "@angular/core";
import { Trophy } from "@models";

@Pipe({
  name: "donated",
  pure: true,
})
export class DonatedPipe implements PipeTransform {
  transform(value: Trophy): string {
    const parts: string[] = [];

    if (value.donor) {
      parts.push("by", value.donor);
    }
    if (value.donated) {
      parts.push("in", value.donated);
    }

    return parts.join(" ");
  }

}
