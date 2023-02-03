import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TrophyEditorComponent } from "./trophy-editor.component";

describe("TrophyEditorComponent", () => {
  let component: TrophyEditorComponent;
  let fixture: ComponentFixture<TrophyEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TrophyEditorComponent ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrophyEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
