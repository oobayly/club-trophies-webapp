import { ComponentFixture, TestBed } from "@angular/core/testing";

import { TrophyFileEditorComponent } from "./trophy-file-editor.component";

describe("TrophyFileEditorComponent", () => {
  let component: TrophyFileEditorComponent;
  let fixture: ComponentFixture<TrophyFileEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TrophyFileEditorComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(TrophyFileEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
