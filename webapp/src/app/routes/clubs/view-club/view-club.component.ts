import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { Club } from "@models";
import { map } from "rxjs";
import { AppTitle } from "src/app/app-routing.module";

@Component({
  selector: "app-view-club",
  templateUrl: "./view-club.component.html",
  styleUrls: ["./view-club.component.scss"],
})
export class ViewClubComponent {
  public readonly clubId$ = this.route.paramMap.pipe(map((x) => x.get("clubId")));

  constructor(
    private readonly route: ActivatedRoute,
    private readonly title: Title,
  ) { }

  public onClubChange(club: Club | undefined): void {
    if (club) {
      this.title.setTitle(`${AppTitle} | ${club.name}`);
    }
  }
}
