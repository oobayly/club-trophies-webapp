import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard, authGuardForRole } from "./core/guards/auth.guard";

const routes: Routes = [
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

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
