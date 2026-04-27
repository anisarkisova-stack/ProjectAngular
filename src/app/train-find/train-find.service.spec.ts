import { TestBed } from '@angular/core/testing';

import { TrainFindService } from './train-find.service';

describe('TrainFindService', () => {
  let service: TrainFindService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainFindService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
