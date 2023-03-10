import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ClubEditorComponent } from "./club-editor.component";

describe("ClubEditorComponent", () => {
  let component: ClubEditorComponent;
  let fixture: ComponentFixture<ClubEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClubEditorComponent ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
