import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TrophyInfoComponent } from "./trophy-info.component";

describe("TrophyInfoComponent", () => {
  let component: TrophyInfoComponent;
  let fixture: ComponentFixture<TrophyInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrophyInfoComponent ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrophyInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
