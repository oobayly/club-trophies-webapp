import { NgModule } from "@angular/core";
import { AngularFireAuthGuard, redirectLoggedInTo } from "@angular/fire/compat/auth-guard"
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "src/app/core/guards/auth.guard";
import { AuthComponent } from "./auth.component";
import { ProfileComponent } from "./profile/profile.component";
import { SignInComponent } from "./sign-in/sign-in.component";
import { SignOutComponent } from "./sign-out/sign-out.component";

const routes: Routes = [
  {
    path: "",
    component: AuthComponent,
    children: [
      {
        path: "profile",
        component: ProfileComponent,
        canActivate: [AuthGuard],
      },
      {
        path: "sign-in",
        component: SignInComponent,
        canActivate: [AngularFireAuthGuard],
        data: {
          authGuardPipe: () => redirectLoggedInTo("/auth/profile"),
        },
      },
      {
        path: "sign-out",
        component: SignOutComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }
