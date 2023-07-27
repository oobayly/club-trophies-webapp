import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Club, Collections, Trophy } from "@models";
import { Title } from "@angular/platform-browser";
import { AppTitle } from "src/app/app-routing.module";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Observable, distinctUntilChanged, map, switchMap, tap } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";
import { toRecord } from "src/app/core/interfaces/DbRecord";
import { TabType } from "src/app/modules/shared/components/trophy-info/trophy-info.component";

@Component({
  selector: "app-view-trophy",
  templateUrl: "./view-trophy.component.html",
  styleUrls: ["./view-trophy.component.scss"],
})
export class ViewTrophyComponent {
  public readonly clubId$ = this.router.paramMap.pipe(map((x) => x.get("clubId")));

  public readonly clubName$ = this.getClubNameObservable();

  public readonly tab$ = this.router.fragment.pipe(tap((x) => console.log(x)), map((x) => x as TabType));

  public readonly trophyId$ = this.router.paramMap.pipe(map((x) => x.get("trophyId")));

  public trophy?: Trophy;

  constructor(
    private readonly db: AngularFirestore,
    private readonly router: ActivatedRoute,
    private readonly title: Title,
  ) { }

  private getClubNameObservable(): Observable<string | undefined> {
    return this.clubId$.pipe(
      filterNotNull(),
      distinctUntilChanged(),
      switchMap((clubId) => this.db.collection<Club>(Collections.Clubs).doc(clubId).snapshotChanges()),
      map((x) => toRecord(x).data?.name),
    );
  }

  public onTrophyChange(trophy: Trophy | undefined): void {
    if (trophy?.name) {
      this.title.setTitle(`${AppTitle} | ${trophy.name}`);
    }

    this.trophy = trophy;
  }
}
