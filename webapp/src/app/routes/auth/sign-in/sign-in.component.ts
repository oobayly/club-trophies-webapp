import { Component, OnDestroy, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { ActivatedRoute, Router } from "@angular/router";
import { first, mergeMap } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";

@Component({
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnInit, OnDestroy {
  private readonly redirectTo = this.route.snapshot.queryParamMap.get("redirectTo") || "/clubs";

  constructor(
    private readonly auth: AngularFireAuth,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.auth.user.pipe(
      filterNotNull(),
      first(),
      mergeMap(() => {
        return this.router.navigateByUrl(this.redirectTo);
      }),
    ).subscribe();
  }

  ngOnDestroy(): void {
    // HACK: Recaptcha adds some elements to to the body element. FirebaseUi doesn't tidy them up 
    // probably because it's been designed for multi-page sites.
    const challenges = document.querySelectorAll("body div div iframe[title='recaptcha challenge']");

    challenges.forEach((x) => {
      // Based on the selector, we know the iframe has two parents so we know they cannot be undefined
      document.body.removeChild(x.parentNode!.parentNode!);
    });
  }
}
