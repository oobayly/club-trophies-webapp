import { Injectable, NgModule } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterModule, RouterStateSnapshot, Routes, TitleStrategy } from "@angular/router";
import { AuthGuard, authGuardForRole } from "./core/guards/auth.guard";
import { HomeComponent } from "./routes/home/home.component";

export const AppTitle = "Club Trophies";

const routes: Routes = [
  {
    path: "",
    pathMatch: "full",
    component: HomeComponent,
  },
  {
    path: "admin",
    loadChildren: () => import("./routes/admin/admin.module").then((m) => m.AdminModule),
    canActivate: [AuthGuard],
    data: {
      ...authGuardForRole("admin"),
    },
  },
  {
    path: "auth",
    loadChildren: () => import("./routes/auth/auth.module").then((m) => m.AuthModule),
  },
  {
    path: "clubs",
    loadChildren: () => import("./routes/clubs/clubs.module").then((m) => m.ClubsModule),
  },
];

@Injectable()
export class TemplatePageTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let title = this.buildTitle(snapshot);

    if (title) {
      title = `${AppTitle} | ${title}`;
    } else {
      title = AppTitle;
    }

    this.title.setTitle(title);
  }
}

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
  ],
})
export class AppRoutingModule { }
