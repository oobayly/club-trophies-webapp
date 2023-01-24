import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinnerEditorComponent } from './winner-editor.component';

describe('WinnerEditorComponent', () => {
  let component: WinnerEditorComponent;
  let fixture: ComponentFixture<WinnerEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WinnerEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WinnerEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
