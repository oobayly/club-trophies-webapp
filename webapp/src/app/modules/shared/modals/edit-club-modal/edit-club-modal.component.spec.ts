import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditClubModalComponent } from "./edit-club-modal.component";

describe("EditClubModalComponent", () => {
  let component: EditClubModalComponent;
  let fixture: ComponentFixture<EditClubModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditClubModalComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditClubModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
