import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WinnerFilterComponent } from './winner-filter.component';

describe('WinnerFilterComponent', () => {
  let component: WinnerFilterComponent;
  let fixture: ComponentFixture<WinnerFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WinnerFilterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WinnerFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
