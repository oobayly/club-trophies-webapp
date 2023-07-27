import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LightboxModalComponent } from "./lightbox-modal.component";

describe("LightboxModalComponent", () => {
  let component: LightboxModalComponent;
  let fixture: ComponentFixture<LightboxModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LightboxModalComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(LightboxModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
