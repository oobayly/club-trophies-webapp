import { NgModule } from "@angular/core";
import { RouterModule, Routes, UrlMatchResult, UrlSegment } from "@angular/router";
import { EditClubComponent } from "./edit-club/edit-club.component";
import { IndexComponent } from "./index/index.component";
import { EditTrophyComponent } from "./trophies/edit-trophy/edit-trophy.component";
import { ViewTrophyComponent } from "./trophies/view-trophy/view-trophy.component";
import { ViewClubComponent } from "./view-club/view-club.component";

const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "public" },
  {
    component: IndexComponent,
    matcher: (url): UrlMatchResult | null => {
      let mode = url[0]?.path;

      switch (mode) {
        case "public":
          break;
        case "mine":
          break;
        default:
          return null;
      }

      return {
        consumed: url,
        posParams: {
          mode: new UrlSegment(mode, {}),
        },
      };
    },
  },
  { path: "new", component: EditClubComponent },
  {
    path: ":clubId",
    children: [
      { path: "", component: ViewClubComponent },
      { path: "edit", component: EditClubComponent },
      {
        path: "trophies",
        children: [
          { path: "new", component: EditTrophyComponent },
          {
            path: ":trophyId",
            children: [
              { path: "", pathMatch: "full", component: ViewTrophyComponent },
              { path: "edit", component: EditTrophyComponent },
            ],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClubsRoutingModule { }
