import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
})
export class SignInComponent implements OnDestroy {

  constructor() { }

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
