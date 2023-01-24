import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrophyComponent } from './edit-trophy.component';

describe('EditTrophyComponent', () => {
  let component: EditTrophyComponent;
  let fixture: ComponentFixture<EditTrophyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditTrophyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTrophyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
