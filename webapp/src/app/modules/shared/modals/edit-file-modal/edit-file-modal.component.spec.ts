import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditFileModalComponent } from "./edit-file-modal.component";

describe("EditFileModalComponent", () => {
  let component: EditFileModalComponent;
  let fixture: ComponentFixture<EditFileModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditFileModalComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(EditFileModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
