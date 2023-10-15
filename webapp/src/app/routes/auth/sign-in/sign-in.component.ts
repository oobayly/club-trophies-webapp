import { Component, OnDestroy, OnInit } from "@angular/core";
import { Auth, EmailAuthProvider, User, UserCredential, authState, createUserWithEmailAndPassword, fetchSignInMethodsForEmail, sendPasswordResetEmail, updateProfile } from "@angular/fire/auth";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { uuid } from "@helpers";
import { FirebaseError } from "firebase/app";
import { signInWithEmailAndPassword } from "firebase/auth";
import { BehaviorSubject, Subscription, first, mergeMap } from "rxjs";
import { filterNotNull } from "src/app/core/rxjs";

type SignInStage = "initial" | "sign-up" | "sign-in" | "reset-sent";

interface SignInForm {
  displayName: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: "app-sign-in",
  templateUrl: "./sign-in.component.html",
  styleUrls: ["./sign-in.component.scss"],
})
export class SignInComponent implements OnInit, OnDestroy {
  public readonly email = this.formBuilder.control("", { nonNullable: true, validators: Validators.email });

  public authError?: string;

  public readonly form = this.buildForm();

  public readonly formId = uuid();

  private readonly redirectTo = this.route.snapshot.queryParamMap.get("redirectTo") || "/clubs";

  public showPassword = false;

  public readonly stage$ = new BehaviorSubject<SignInStage>("initial");

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly auth: Auth,
    private readonly formBuilder: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    this.email.patchValue(route.snapshot.queryParamMap.get("email") ?? "");
    this.subscriptions.push(this.getStageSubscription());
  }

  ngOnInit(): void {
    authState(this.auth).pipe(
      filterNotNull(),
      first(),
      mergeMap(() => {
        return this.router.navigateByUrl(this.redirectTo);
      }),
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  private buildForm(): FormGroup<SignInForm> {
    return this.formBuilder.group({
      displayName: this.formBuilder.control("", { nonNullable: true }),
      password: this.formBuilder.control("", { nonNullable: true }),
    }, {
      updateOn: "submit",
    });
  }

  private getStageSubscription(): Subscription {
    return this.stage$.subscribe((stage) => {
      this.authError = undefined;
      this.form.reset();

      if (stage === "sign-in") {
        this.form.controls["displayName"].disable();
      } else {
        this.form.controls["displayName"].enable();
      }
    })
  }

  private async handleUserCredential(action: Promise<UserCredential>, displayName?: string): Promise<User | undefined> {
    let credential: UserCredential;
    try {
      credential = await action;
    } catch (err) {
      console.log(err);

      let error: string | undefined;

      if (err instanceof FirebaseError) {
        if (err.code === "auth/weak-password") {
          error = "The password you've chosen is too weak. Strong passwords have at least 6 characters and a mix of letters and numbers";
        } else if (err.code === "auth/wrong-password") {
          error = "The email and password you entered don't match";
        } else if (err.code === "auth/user-disabled") {
          error = "The account for the email address has been disabled"
        }
      }

      this.authError = error || "An unexpected error occurred. Please try again";

      return;
    }

    if (displayName) {
      await updateProfile(credential.user, {
        displayName,
      });
    }

    return credential.user;
  }

  public async onEmailSubmit(): Promise<void> {
    const email = this.email.value;

    if (this.email.invalid || !email) {
      return;
    }

    const methods = await fetchSignInMethodsForEmail(this.auth, email);

    if (!methods.length) {
      this.stage$.next("sign-up");
    } else if (methods.includes(EmailAuthProvider.EMAIL_PASSWORD_SIGN_IN_METHOD)) {
      this.stage$.next("sign-in");
    }
  }

  public async onResetPasswordClick(e: Event): Promise<void> {
    e.preventDefault();

    const email = this.email.value;

    if (!email) {
      return;
    }

    await sendPasswordResetEmail(this.auth, email, {
      url: "https://club-trophies.web.app/auth/sign-in?email=" + encodeURIComponent(email),
    });

    this.stage$.next("reset-sent");
  }

  public async onSignInSubmit(): Promise<void> {
    const email = this.email.value;
    const { displayName, password } = this.form.value;

    if (this.form.invalid || !email || !password) {
      return;
    }

    const task = this.stage$.value === "sign-in"
      ? signInWithEmailAndPassword(this.auth, email, password)
      : createUserWithEmailAndPassword(this.auth, email, password)
      ;

    const user = await this.handleUserCredential(task, displayName);

    if (user) {
      await this.router.navigateByUrl(this.redirectTo);
    }
  }

}
