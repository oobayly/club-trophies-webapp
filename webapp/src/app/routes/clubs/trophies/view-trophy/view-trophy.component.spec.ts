import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewTrophyComponent } from './view-trophy.component';

describe('ViewTrophyComponent', () => {
  let component: ViewTrophyComponent;
  let fixture: ComponentFixture<ViewTrophyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewTrophyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewTrophyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
