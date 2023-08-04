import { Component } from "@angular/core";
import { Auth, authState } from "@angular/fire/auth";
import { idToken } from "src/app/core/rxjs";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent {
  public readonly user$ = authState(this.auth);

  public readonly token$ = this.user$.pipe(idToken());

  constructor(
    private auth: Auth,
  ) { }
}
