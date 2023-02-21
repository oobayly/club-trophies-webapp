import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard, authGuardForRole } from "src/app/core/guards/auth.guard";
import { EditClubComponent } from "./edit-club/edit-club.component";
import { IndexComponent } from "./index/index.component";
import { EditTrophyComponent } from "./trophies/edit-trophy/edit-trophy.component";
import { ViewTrophyComponent } from "./trophies/view-trophy/view-trophy.component";
import { ViewClubComponent } from "./view-club/view-club.component";

const routes: Routes = [
  { path: "", pathMatch: "full", redirectTo: "public" },
  {
    path: "public",
    component: IndexComponent,
    title: "Public Clubs",
    data: {
      mode: "public",
    },
  },
  {
    path: "mine",
    component: IndexComponent,
    title: "My Clubs",
    canActivate: [AuthGuard],
    data: {
      mode: "mine",
    },
  },
  {
    path: "all",
    component: IndexComponent,
    title: "All Clubs",
    canActivate: [AuthGuard],
    data: {
      ...authGuardForRole("admin"),
      mode: "all",
    },
  },
  // {
  //   component: IndexComponent,
  //   matcher: (url): UrlMatchResult | null => {
  //     let mode = url[0]?.path;

  //     switch (mode) {
  //       case "public":
  //         break;
  //       case "mine":
  //         break;
  //       default:
  //         return null;
  //     }

  //     return {
  //       consumed: url,
  //       posParams: {
  //         mode: new UrlSegment(mode, {}),
  //       },
  //     };
  //   },
  //   title: (route): string => {
  //     switch (route.paramMap.get("mode")) {
  //       case "public":
  //         return "Public Clubs";
  //       case "mine":
  //         return "My Clubs";
  //       default:
  //         return "";
  //     }
  //   },
  // },
  { path: "new", component: EditClubComponent, title: "Add new club" },
  {
    path: ":clubId",
    children: [
      { path: "", component: ViewClubComponent },
      { path: "edit", component: EditClubComponent },
      {
        path: "trophies",
        children: [
          { path: "new", component: EditTrophyComponent, title: "Add new club" },
          {
            path: ":trophyId",
            children: [
              { path: "", pathMatch: "full", component: ViewTrophyComponent },
              { path: "edit", component: EditTrophyComponent },
            ],
          },
        ],
      },
      {
        path: "boats",
        children: [
          { path: "new", component: EditTrophyComponent, title: "Add new boat" },
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
