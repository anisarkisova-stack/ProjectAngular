import { TestBed } from '@angular/core/testing';

import { InvoisService } from './invois.service';

describe('InvoisService', () => {
  let service: InvoisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
