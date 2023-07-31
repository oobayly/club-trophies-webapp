import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ResultsComponent } from "./results/results.component";

const routes: Routes = [
  {
    path: ":searchId",
    component: ResultsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SearchRoutingModule { }
