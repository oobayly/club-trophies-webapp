import { NgModule } from "@angular/core";
import { AngularFireModule } from "@angular/fire/compat"
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from "@angular/fire/compat/auth";
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR } from "@angular/fire/compat/firestore";
import { AngularFireStorageModule, USE_EMULATOR as USE_STORAGE_EMULATOR } from "@angular/fire/compat/storage";
import { FormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { FirebaseUIModule } from "firebaseui-angular"
import { environment } from "src/environments/environment";
import { firebaseConfig, firebaseUiAuthConfig } from "src/environments/firebase";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    // Angular
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    // Firebase
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig),
  ],
  providers: [
    {
      provide: USE_AUTH_EMULATOR, useValue: environment.emulate ? ["http://localhost:9099"] : undefined,
    },
    { provide: USE_FIRESTORE_EMULATOR, useValue: environment.emulate ? ["localhost", 8080] : undefined },
    { provide: USE_STORAGE_EMULATOR, useValue: environment.emulate ? ["localhost", 9199] : undefined },
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
