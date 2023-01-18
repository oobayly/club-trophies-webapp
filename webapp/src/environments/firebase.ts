import { FirebaseOptions } from "firebase/app";
import { firebase } from "firebaseui-angular";

export const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyCEWXdBSaX2aUHc9v-hGJuMkzyIQ6JPBls",
  authDomain: "club-trophies.firebaseapp.com",
  projectId: "club-trophies",
  storageBucket: "club-trophies.appspot.com",
  messagingSenderId: "773505282864",
  appId: "1:773505282864:web:967c5e2a491f7ca5bc4ef5"
};

export const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInFlow: "popup",
  signInOptions: [
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    {
      provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
      defaultCountry: "IE",
      whitelistedCountries: ["GB", "IE"]
    }
  ]
}
