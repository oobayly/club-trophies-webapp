import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { map, Observable, tap } from "rxjs";
import { AppTitle } from "src/app/app-routing.module";
import { ViewMode } from "src/app/modules/shared/components/clubs-list/clubs-list.component";

@Component({
  selector: "app-index",
  templateUrl: "./index.component.html",
  styleUrls: ["./index.component.scss"],
})
export class IndexComponent {
  public readonly mode$ = this.getModeObservable();

  public readonly title$ = this.getTitleObservable();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly title: Title,
  ) { }

  private getModeObservable(): Observable<ViewMode> {
    return this.route.data.pipe(
      map((data) => {
        switch (data["mode"]) {
          case "mine":
            return "mine";
          case "all":
            return "all";
          default:
            return "public";
        }
      }),
    )
  }

  private getTitleObservable(): Observable<string> {
    return this.mode$.pipe(
      map((mode) => {
        if (mode === "all") {
          return "All Clubs";
        } else if (mode === "mine") {
          return "My Clubs";
        } else {
          return "Public Clubs";
        }
      }),
      tap((title) => {
        this.title.setTitle(`${AppTitle} | ${title}`);
      }),
    )
  }
}
