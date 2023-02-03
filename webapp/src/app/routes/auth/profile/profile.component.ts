import { Component } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";

@Component({
  selector: "app-profile",
  templateUrl: "./profile.component.html",
  styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent {
  public readonly token$ = this.auth.idTokenResult;

  public readonly user$ = this.auth.user;

  constructor(
    private auth: AngularFireAuth,
  ) { }
}
