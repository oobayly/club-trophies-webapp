import { NgModule } from "@angular/core";
import { AngularFireModule } from "@angular/fire/compat"
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from "@angular/fire/compat/auth";
import { AngularFirestoreModule, USE_EMULATOR as USE_FIRESTORE_EMULATOR } from "@angular/fire/compat/firestore";
import { AngularFireStorageModule, USE_EMULATOR as USE_STORAGE_EMULATOR } from "@angular/fire/compat/storage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { FirebaseUIModule } from "firebaseui-angular"
import { environment } from "src/environments/environment";
import { firebaseConfig, firebaseUiAuthConfig } from "src/environments/firebase";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./routes/home/home.component";
import { ServiceWorkerModule } from "@angular/service-worker";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
  ],
  imports: [
    // Angular
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    // Firebase
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AngularFireStorageModule,
    FirebaseUIModule.forRoot(firebaseUiAuthConfig),
    // Bootstrap
    NgbModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
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
