import { Component } from "@angular/core";
import { DbService } from "src/app/core/services/db.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent {

  constructor(
    private db: DbService,
  ) {
    // window.setTimeout(() => {
    //   db.createSearch({
    //     clubId: "R0a8BjOvIB8i5MP6THj8",
    //     boatName: "IACC",
    //     sail: null,
    //   }).then(console.log);
    // }, 1000);
    // db.getSearchResults("Pu4qUwwh68N0KZxRDsrM").subscribe((x) => console.log(x));
    // db.searchWinners({
    //   clubId: null,
    //   boatName: "IACC",
    //   sail: null,
    // }).subscribe((x) => console.log(x));
    // const ref = db.collection<Boat>(Collections.Boats);
    // const batch = db.firestore.batch();

    // this.Boats.forEach((x) => {
    //   const r = x[2] ? db.collection(Collections.Clubs).doc(x[2]).collection<Boat>(Collections.Boats).doc().ref : ref.doc().ref;
    //   batch.set(r, x[1]);
    // });

    // batch.commit().then();
  }
}
