import { HttpClientModule } from "@angular/common/http";
import { NgModule } from "@angular/core";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import { connectAuthEmulator, getAuth, provideAuth } from "@angular/fire/auth";
import { connectFirestoreEmulator, getFirestore, provideFirestore } from "@angular/fire/firestore";
import { connectStorageEmulator, getStorage, provideStorage } from "@angular/fire/storage";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from "@angular/platform-browser";
import { ServiceWorkerModule } from "@angular/service-worker";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { environment } from "src/environments/environment";
import { firebaseConfig } from "src/environments/firebase";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HomeComponent } from "./routes/home/home.component";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
  ],
  imports: [
    // Angular
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    // Firebase
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => {
      const auth = getAuth();

      if (environment.emulate) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }

      return auth;
    }),
    provideFirestore(() => {
      const db = getFirestore();

      if (environment.emulate) {
        connectFirestoreEmulator(db, "localhost", 8080);
      }

      return db;
    }),
    provideStorage(() => {
      const storage = getStorage();

      if (environment.emulate) {
        connectStorageEmulator(storage, "localhost", 9199);
      }

      return storage;
    }),
    // Bootstrap
    NgbModule,
    ServiceWorkerModule.register("ngsw-worker.js", {
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule { }
