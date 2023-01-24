import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";

@Component({
  selector: 'app-view-club',
  templateUrl: './view-club.component.html',
  styleUrls: ['./view-club.component.scss']
})
export class ViewClubComponent implements OnInit {
  public readonly clubId$ = this.route.paramMap.pipe(map((x) => x.get("clubId")));

  constructor(
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
  }

}
