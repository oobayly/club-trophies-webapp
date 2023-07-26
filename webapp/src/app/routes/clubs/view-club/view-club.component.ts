import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute, Router } from "@angular/router";
import { Club, Trophy } from "@models";
import { map } from "rxjs";
import { AppTitle } from "src/app/app-routing.module";
import { DbRecord } from "src/app/core/interfaces/DbRecord";

@Component({
  selector: "app-view-club",
  templateUrl: "./view-club.component.html",
  styleUrls: ["./view-club.component.scss"],
})
export class ViewClubComponent {
  // ========================
  // Properties
  // ========================

  public canEdit?: boolean;

  public readonly clubId$ = this.route.paramMap.pipe(map((x) => x.get("clubId")));

  public readonly trophyId$ = this.route.queryParamMap.pipe(map((x) => x.get("trophyId")));

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly route: ActivatedRoute,
    private router: Router,
    private readonly title: Title,
  ) { }

  // ========================
  // Event handlers
  // ========================

  public async onBackClick(): Promise<void> {
    await this.router.navigate([]);
  }

  public onClubChange(club: Club | undefined): void {
    if (club) {
      this.title.setTitle(`${AppTitle} | ${club.name}`);
    }
  }

  public async onTrophyClick(item: DbRecord<Trophy>): Promise<void> {
    // Use relative navigation to keep the club state
    await this.router.navigate([], {
      queryParams: {
        trophyId: item.id,
      },
    });
  }
}
