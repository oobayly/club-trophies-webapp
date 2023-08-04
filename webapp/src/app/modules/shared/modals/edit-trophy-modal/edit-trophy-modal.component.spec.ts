import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditTrophyModalComponent } from "./edit-trophy-modal.component";

describe("EditTrophyModalComponent", () => {
  let component: EditTrophyModalComponent;
  let fixture: ComponentFixture<EditTrophyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTrophyModalComponent ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTrophyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
