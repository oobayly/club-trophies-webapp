import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "src/app/modules/shared/shared.module";
import { ClubsRoutingModule } from "./clubs-routing.module";
import { IndexComponent } from "./index/index.component";
import { ViewTrophyComponent } from "./trophies/view-trophy/view-trophy.component";
import { ViewClubComponent } from "./view-club/view-club.component";

@NgModule({
  declarations: [
    IndexComponent,
    ViewClubComponent,
    ViewTrophyComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClubsRoutingModule,
    SharedModule,
  ],
})
export class ClubsModule { }
