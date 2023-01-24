import { Component, OnInit } from '@angular/core';
import { ViewMode } from "src/app/modules/shared/components/clubs-list/clubs-list.component";

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.scss']
})
export class IndexComponent implements OnInit {
  public mode?: ViewMode;

  constructor() { }

  ngOnInit(): void {
  }

}
