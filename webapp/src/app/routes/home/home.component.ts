import { Component } from "@angular/core";
import { Boat } from "@models";
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
    // const ref = db.collection<Boat>(Collections.Boats);
    // const batch = db.firestore.batch();

    // this.Boats.forEach((x) => {
    //   const r = x[2] ? db.collection(Collections.Clubs).doc(x[2]).collection<Boat>(Collections.Boats).doc().ref : ref.doc().ref;
    //   batch.set(r, x[1]);
    // });

    // batch.commit().then();
  }

  private readonly Boats: [number, Boat, string | undefined][] = [
    {
      "fldClassID": 1,
      "fldName": "Yacht",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
      club: "I0PPhPQPbiqFsE8pmhoI",
    },
    {
      "fldClassID": 2,
      "fldName": "Shannon One Design",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "2018-08-16 13:30:39",
    },
    {
      "fldClassID": 3,
      "fldName": "Laser",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 4,
      "fldName": "Laser Radial",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 5,
      "fldName": "Laser 4.7",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 6,
      "fldName": "Mirror",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 7,
      "fldName": "Optimist",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 8,
      "fldName": "420",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
    },
    {
      "fldClassID": 9,
      "fldName": "Cruiser",
      "fldCreated": "2012-08-23 00:00:00",
      "fldModified": "",
      club: "I0PPhPQPbiqFsE8pmhoI",
    },
    {
      "fldClassID": 10,
      "fldName": "Merit",
      "fldCreated": "2012-08-30 22:45:37",
      "fldModified": "",
    },
    {
      "fldClassID": 11,
      "fldName": "Fishing",
      "fldCreated": "2012-08-30 22:47:43",
      "fldModified": "",
      club: "I0PPhPQPbiqFsE8pmhoI",
    },
    {
      "fldClassID": 12,
      "fldName": "Enterprise",
      "fldCreated": "2012-11-22 16:47:56",
      "fldModified": "",
    },
    {
      "fldClassID": 17,
      "fldName": "Squib",
      "fldCreated": "2012-11-22 16:56:34",
      "fldModified": "2014-08-12 23:25:08",
    },
    {
      "fldClassID": 14,
      "fldName": "Firefly",
      "fldCreated": "2012-11-22 16:48:00",
      "fldModified": "",
    },
    {
      "fldClassID": 15,
      "fldName": "Dragon",
      "fldCreated": "2012-11-22 16:48:04",
      "fldModified": "",
    },
    {
      "fldClassID": 16,
      "fldName": "Fireball",
      "fldCreated": "2012-11-22 16:48:05",
      "fldModified": "",
    },
    {
      "fldClassID": 18,
      "fldName": "Topper",
      "fldCreated": "2015-11-05 11:42:34",
      "fldModified": "",
    },
    {
      "fldClassID": 19,
      "fldName": "Snipe",
      "fldCreated": "2015-11-05 12:13:43",
      "fldModified": "",
    },
    {
      "fldClassID": 20,
      "fldName": "Inter Club Team Racing (Juniors)",
      "fldCreated": "2022-08-02 10:36:06",
      "fldModified": "",
      club: "I0PPhPQPbiqFsE8pmhoI",
    },
  ].map((x) => {
    return [x.fldClassID, {
      name: x.fldName,
      created: new Date(x.fldCreated),
      modified: x.fldModified ? new Date(x.fldModified) : null,
      archived: false,
    }, x.club]
  })
}
