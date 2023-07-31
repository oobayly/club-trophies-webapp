import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";

@Component({
  selector: "app-results",
  templateUrl: "./results.component.html",
  styleUrls: ["./results.component.scss"],
})
export class ResultsComponent {
  // ========================
  // Properties
  // ========================

  public readonly searchId$ = this.route.paramMap.pipe(map((x) => x.get("searchId")));

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly route: ActivatedRoute,
  ) {
  }
}
