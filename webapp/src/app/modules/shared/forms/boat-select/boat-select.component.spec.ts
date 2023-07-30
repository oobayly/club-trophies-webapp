import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BoatSelectComponent } from "./boat-select.component";

describe("BoatSelectComponent", () => {
  let component: BoatSelectComponent;
  let fixture: ComponentFixture<BoatSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BoatSelectComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(BoatSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
