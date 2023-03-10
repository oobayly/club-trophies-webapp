import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AuthRoutingModule } from "./auth-routing.module";
import { SignInComponent } from "./sign-in/sign-in.component";
import { SignOutComponent } from "./sign-out/sign-out.component";
import { ProfileComponent } from "./profile/profile.component";
import { AuthComponent } from "./auth.component";
import { FirebaseUIModule } from "firebaseui-angular";
import { RouterModule } from "@angular/router";


@NgModule({
  declarations: [
    SignInComponent,
    SignOutComponent,
    ProfileComponent,
    AuthComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    AuthRoutingModule,
    FirebaseUIModule,
  ],
})
export class AuthModule { }
