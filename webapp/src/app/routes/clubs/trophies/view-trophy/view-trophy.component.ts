import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

@Component({
  selector: "app-view-trophy",
  templateUrl: "./view-trophy.component.html",
  styleUrls: ["./view-trophy.component.scss"],
})
export class ViewTrophyComponent {
  public readonly clubId = this.router.snapshot.paramMap.get("clubId");

  public readonly trophyId = this.router.snapshot.paramMap.get("trophyId");

  constructor(
    private readonly router: ActivatedRoute,
  ) { }
}
