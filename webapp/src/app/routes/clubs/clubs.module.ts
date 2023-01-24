import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClubsRoutingModule } from './clubs-routing.module';
import { IndexComponent } from './index/index.component';
import { EditClubComponent } from './edit-club/edit-club.component';
import { ViewClubComponent } from './view-club/view-club.component';
import { ViewTrophyComponent } from './trophies/view-trophy/view-trophy.component';
import { EditTrophyComponent } from './trophies/edit-trophy/edit-trophy.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "src/app/modules/shared/shared.module";


@NgModule({
  declarations: [
    IndexComponent,
    EditClubComponent,
    ViewClubComponent,
    ViewTrophyComponent,
    EditTrophyComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClubsRoutingModule,
    SharedModule,
  ]
})
export class ClubsModule { }
