import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, Observable } from "rxjs";
import { ViewMode } from "src/app/modules/shared/components/clubs-list/clubs-list.component";

@Component({
  selector: "app-index",
  templateUrl: "./index.component.html",
  styleUrls: ["./index.component.scss"],
})
export class IndexComponent {
  public readonly mode$ = this.getModeObservable();

  constructor(
    private route: ActivatedRoute,
  ) { }

  private getModeObservable(): Observable<ViewMode> {
    return this.route.data.pipe(
      map((data) => {
        switch (data["mode"]) {
          case "mine":
            return "mine";
          default:
            return "public";
        }
      }),
    )
  }
}
