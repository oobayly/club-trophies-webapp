import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Club, Trophy } from "@models";
import { Title } from "@angular/platform-browser";
import { AppTitle } from "src/app/app-routing.module";
import { map } from "rxjs";
import { TabType } from "src/app/modules/shared/components/trophy-info/trophy-info.component";

@Component({
  selector: "app-view-trophy",
  templateUrl: "./view-trophy.component.html",
  styleUrls: ["./view-trophy.component.scss"],
})
export class ViewTrophyComponent {
  public readonly clubId$ = this.router.paramMap.pipe(map((x) => x.get("clubId")));

  public readonly tab$ = this.router.fragment.pipe(map((x) => x as TabType));

  public readonly trophyId$ = this.router.paramMap.pipe(map((x) => x.get("trophyId")));

  public club?: Club;

  public trophy?: Trophy;

  constructor(
    private readonly router: ActivatedRoute,
    private readonly title: Title,
  ) { }

  public onClubChange(club: Club | undefined): void {
    this.club = club;
  }

  public onTrophyChange(trophy: Trophy | undefined): void {
    if (trophy?.name) {
      this.title.setTitle(`${AppTitle} | ${trophy.name}`);
    }

    this.trophy = trophy;
  }
}
