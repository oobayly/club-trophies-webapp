import { Directive, ElementRef, Input } from "@angular/core";
import { Club } from "@models";

type LogoLike = Pick<Club, "logo"> | string;

const DefaultLogoImage = "/assets/generic-burgee.svg";

@Directive({
  selector: "[appClubLogo]",
})
export class ClubLogoDirective {
  @Input()
  public set appClubLogo(value: LogoLike | null | undefined) {
    let src: string | undefined;

    if (value) {
      if (typeof value === "string") {
        src = value;
      } else {
        src = value.logo;
      }
    }

    this.el.nativeElement.src = src || DefaultLogoImage;
  }

  constructor(
    private readonly el: ElementRef<HTMLImageElement>,
  ) { }
}
