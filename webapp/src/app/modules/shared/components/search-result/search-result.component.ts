import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from "@angular/core";
import { SearchClubInfo, SearchResult, SearchTrophyInfo, SearchWithResults, filterByNormalisedText, getBoatNames } from "@models";
import { BehaviorSubject, Observable, Subject, catchError, combineLatest, distinctUntilChanged, filter, map, of, shareReplay, switchMap, takeUntil } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";
import { DbService } from "src/app/core/services/db.service";
import { WinnerFilter } from "../winner-filter/winner-filter.component";

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

  public readonly boatNames$: Observable<string[]>;

  public readonly filter$ = new BehaviorSubject<WinnerFilter>({});

  public readonly searchId$ = new BehaviorSubject<string | undefined>(undefined);

  private readonly search$: Observable<SearchWithResults | undefined>;

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
    this.boatNames$ = this.getBoatNames();
    this.results$ = this.getExpandedResults();
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

  private getBoatNames(): Observable<string[]> {
    return this.search$.pipe(
      filterNotNull(),
      map((search) => getBoatNames(search.results)),
    )
  }

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
    const normalizedFilter$ = this.filter$.pipe(
      map((x): WinnerFilter => {
        return {
          boatName: x.boatName,
          sail: x.sail?.toLocaleUpperCase(),
          text: x.text?.toLocaleUpperCase(),
        }
      }),
    );

    return combineLatest([
      this.search$,
      normalizedFilter$,
    ]).pipe(
      filter(([search]) => !!search),
      map(([search, filter]) => {
        search = search!; // Already filtered

        let { results } = search;
        const { boatName, sail, text } = filter;

        if (boatName === "none") {
          results = results.filter((x) => x.boatName === undefined);
        } else if (boatName) {
          results = results.filter((x) => x.boatName === boatName);
        }
        if (sail) {
          results = filterByNormalisedText(results, sail, ["sail"]);
        }
        if (text) {
          results = filterByNormalisedText(results, text, ["club", "crew", "helm", "name", "owner"]);
        }

        // Take a deep copy of the clubs so we can modify the trophies
        const clubs = search.clubs
          ?.map((club) => {
            const trophies = club.trophies
              .map((item) => {
                return SearchResultComponent.getResultsForTrophy(club.clubId, item, results);
              })
              .filter((x) => x.results.length)
              ;

            return {
              ...club,
              trophies,
            };
          })
          .filter((x) => x.trophies.length) // Exclude any club or trophies with no results after filtering
          ;

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
