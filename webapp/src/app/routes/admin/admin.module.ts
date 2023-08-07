import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { AdminRoutingModule } from "./admin-routing.module";
import { AdminComponent } from "./admin.component";
import { UsersComponent } from "./users/users.component";


@NgModule({
  declarations: [
    AdminComponent,
    UsersComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
  ],
})
export class AdminModule { }
