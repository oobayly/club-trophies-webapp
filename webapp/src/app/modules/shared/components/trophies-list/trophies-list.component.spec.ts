import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TrophiesListComponent } from "./trophies-list.component";

describe("TrophiesListComponent", () => {
  let component: TrophiesListComponent;
  let fixture: ComponentFixture<TrophiesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrophiesListComponent ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrophiesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
