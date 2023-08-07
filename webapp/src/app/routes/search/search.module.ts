import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { SharedModule } from "../../modules/shared/shared.module";
import { ResultsComponent } from "./results/results.component";
import { SearchRoutingModule } from "./search-routing.module";


@NgModule({
  declarations: [
    ResultsComponent,
  ],
  imports: [
    CommonModule,
    SearchRoutingModule,
    SharedModule,
  ],
})
export class SearchModule { }
