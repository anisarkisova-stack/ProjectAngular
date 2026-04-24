import { TestBed } from '@angular/core/testing';

import { authGuard } from './auth-guard';

describe('AuthGuard', () => {
  let service= authGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(authGuard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
