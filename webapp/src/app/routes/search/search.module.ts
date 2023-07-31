import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { SearchRoutingModule } from "./search-routing.module";
import { ResultsComponent } from "./results/results.component";
import { SharedModule } from "../../modules/shared/shared.module";


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
