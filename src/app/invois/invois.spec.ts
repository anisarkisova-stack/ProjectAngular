import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Invois } from './invois';

describe('Invois', () => {
  let component: Invois;
  let fixture: ComponentFixture<Invois>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Invois],
    }).compileComponents();

    fixture = TestBed.createComponent(Invois);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
