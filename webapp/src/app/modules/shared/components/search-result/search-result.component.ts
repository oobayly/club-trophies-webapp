import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { SearchClubInfo, SearchResult, SearchTrophyInfo, SearchWithResults } from "@models";
import { Observable, Subject, distinctUntilChanged, switchMap, catchError, of, takeUntil, shareReplay, BehaviorSubject, map } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";

interface SearchClubInfoWithResults extends SearchClubInfo {
  trophies: SearchTrophyInfoWithResults[];
}

interface SearchTrophyInfoWithResults extends SearchTrophyInfo {
  results: SearchResult[];
}

@Component({
  selector: "app-search-result",
  templateUrl: "./search-result.component.html",
  styleUrls: ["./search-result.component.scss"],
})
export class SearchResultComponent implements OnChanges, OnDestroy {
  // ========================
  // Properties
  // ========================

  public hasError = false;

  public readonly searchId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly search$: Observable<SearchWithResults | undefined>;

  public readonly hasResults$: Observable<boolean>;

  public readonly results$: Observable<SearchClubInfoWithResults[]>;

  private readonly destroyed$ = new Subject<void>();

  // ========================
  // Inputs
  // ========================

  @Input()
  public searchId: string | null | undefined;

  // ========================
  // Lifecycle
  // ========================

  constructor(
    private readonly db: DbService,
  ) {
    this.search$ = this.getSearchObservable();
    this.results$ = this.getExpandedResults();
    this.hasResults$ = this.search$.pipe(map((x) => !!x?.results.length));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ("searchId" in changes) {
      this.searchId$.next(this.searchId || undefined);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
  }

  // ========================
  // Methods
  // ========================

  private getSearchObservable(): Observable<SearchWithResults | undefined> {
    return this.searchId$.pipe(
      filterNotNull(),
      distinctUntilChanged(),
      switchMap((searchId) => this.db.getSearchResults(searchId)),
      catchError((err) => {
        console.log(err);

        this.hasError = true;

        return of(undefined);
      }),
      takeUntil(this.destroyed$),
      shareReplay(1),
    )
  }

  private getExpandedResults(): Observable<SearchClubInfoWithResults[]> {
    return this.search$.pipe(
      filterNotNull(),
      map((search) => {
        // Take a deep copy of the clubs so we can modify the trophied
        const clubs = search.clubs?.map((club) => {
          const trophies = club.trophies.map((item) => {
            return SearchResultComponent.getResultsForTrophy(club.clubId, item, search.results);
          });

          return {
            ...club,
            trophies,
          }
        });

        return clubs;
      }),
    )
  }

  private static getResultsForTrophy(clubId: string, trophy: SearchTrophyInfo, results: SearchResult[]): SearchTrophyInfoWithResults {
    const { trophyId } = trophy;

    return {
      ...trophy,
      results: results.filter((x) => x.parent.clubId === clubId && x.parent.trophyId === trophyId),
    };
  }
}
