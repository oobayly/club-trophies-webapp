import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AdminComponent } from "./admin.component";
import { UsersComponent } from "./users/users.component";

const routes: Routes = [
  {
    path: "",
    component: AdminComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "users" },
      {
        path: "users",
        component: UsersComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule { }
