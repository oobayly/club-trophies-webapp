import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { AuthRoutingModule } from "./auth-routing.module";
import { AuthComponent } from "./auth.component";
import { ProfileComponent } from "./profile/profile.component";
import { SignInComponent } from "./sign-in/sign-in.component";


@NgModule({
  declarations: [
    SignInComponent,
    ProfileComponent,
    AuthComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    AuthRoutingModule,
  ],
})
export class AuthModule { }
