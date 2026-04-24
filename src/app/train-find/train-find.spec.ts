import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainFind } from './train-find';

describe('TrainFind', () => {
  let component: TrainFind;
  let fixture: ComponentFixture<TrainFind>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainFind],
    }).compileComponents();

    fixture = TestBed.createComponent(TrainFind);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
