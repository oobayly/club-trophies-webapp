import { Component, OnInit } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/compat/auth";

@Component({
  selector: "app-sign-out",
  templateUrl: "./sign-out.component.html",
  styleUrls: ["./sign-out.component.scss"],
})
export class SignOutComponent implements OnInit {

  constructor(
    private auth: AngularFireAuth,
  ) { }

  ngOnInit(): void {
    this.auth.signOut()
  }
}
