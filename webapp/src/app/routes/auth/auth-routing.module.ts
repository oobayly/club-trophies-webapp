import { NgModule } from "@angular/core";
import { AuthGuard, redirectLoggedInTo } from "@angular/fire/auth-guard";
import { RouterModule, Routes } from "@angular/router";
import { SignOutResolver } from "src/app/core/resolvers/sign-out.resolver";
import { AuthComponent } from "./auth.component";
import { SignInComponent } from "./sign-in/sign-in.component";

const routes: Routes = [
  {
    path: "",
    component: AuthComponent,
    children: [
      // TODO: Implment profile
      // {
      //   path: "profile",
      //   component: ProfileComponent,
      //   canActivate: [AuthGuard],
      //   title: "My pofile",
      // },
      {
        path: "sign-in",
        component: SignInComponent,
        canActivate: [AuthGuard],
        title: "Sign in",
        data: {
          authGuardPipe: () => redirectLoggedInTo("/auth/profile"),
        },
      },
      {
        path: "sign-out",
        component: SignInComponent, // Need a component here even if it's never accessed
        resolve: {
          signedOut: SignOutResolver,
        },
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule { }
