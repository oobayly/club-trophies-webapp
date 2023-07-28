import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditWinnerModalComponent } from "./edit-winner-modal.component";

describe("EditWinnerModalComponent", () => {
  let component: EditWinnerModalComponent;
  let fixture: ComponentFixture<EditWinnerModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditWinnerModalComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditWinnerModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
