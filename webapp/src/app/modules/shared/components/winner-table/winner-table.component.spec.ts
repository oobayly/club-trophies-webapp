import { ComponentFixture, TestBed } from "@angular/core/testing";

import { WinnerTableComponent } from "./winner-table.component";

describe("WinnerTableComponent", () => {
  let component: WinnerTableComponent;
  let fixture: ComponentFixture<WinnerTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WinnerTableComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(WinnerTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
