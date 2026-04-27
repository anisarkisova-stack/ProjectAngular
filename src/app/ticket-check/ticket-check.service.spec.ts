import { TestBed } from '@angular/core/testing';

import { TicketCheckService } from './ticket-check.service';

describe('TicketCheckService', () => {
  let service: TicketCheckService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketCheckService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
