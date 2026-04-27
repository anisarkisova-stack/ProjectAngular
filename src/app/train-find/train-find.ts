import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TrainFindService, Train, SearchParams } from './train-find.service';

@Component({
  selector: 'app-train-find',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './train-find.html',
  styleUrl: './train-find.scss',
})
export class TrainFind implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  params: SearchParams = {} as SearchParams;
  trains: Train[]      = [];
  loading              = true;

  get formattedDate(): string {
    return this.trainFindService.formatDate(this.params.date);
  }

  constructor(
    private trainFindService: TrainFindService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.params = this.trainFindService.getSearchParams();

    this.trainFindService.getFilteredTrains(this.params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: trains => {
          this.trains  = trains;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  book(train: Train): void {
    this.trainFindService.saveBookingAndNavigate(train, this.params);
  }
}