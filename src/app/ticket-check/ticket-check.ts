import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, takeUntil, tap, catchError, filter, map } from 'rxjs/operators';

import { CartService } from '../auth/cart-service';
import { TicketCheckService, Ticket, Person } from './ticket-check.service';

type PageState = 'idle' | 'loading' | 'success' | 'cancelled' | 'error';

@Component({
  selector: 'app-ticket-check',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-check.html',
  styleUrls: ['./ticket-check.scss'],
})
export class TicketCheck implements OnInit, OnDestroy {
  private readonly route    = inject(ActivatedRoute);
  private readonly service  = inject(CartService);
  private readonly tcService = inject(TicketCheckService);
  private readonly destroy$ = new Subject<void>();

  private readonly searchTrigger$ = new Subject<string>();
  private readonly cancelTrigger$ = new Subject<string>();

  readonly ticketControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly state         = signal<PageState>('idle');
  readonly ticket        = signal<Ticket | null>(null);
  readonly errorMessage  = signal('');
  readonly showModal     = signal(false);
  readonly cancelLoading = signal(false);
  readonly cancelledId   = signal('');

  readonly isLoading   = computed(() => this.state() === 'loading');
  readonly isSuccess   = computed(() => this.state() === 'success');
  readonly isCancelled = computed(() => this.state() === 'cancelled');

  particles: string[] = [];

  get today(): string { return this.tcService.getToday(); }

  getSeatNumber(p: Person): string   { return this.tcService.getSeatNumber(p); }
  getStatusClass(s?: string): string { return this.tcService.getStatusClass(s); }
  getStatusLabel(s?: string): string { return this.tcService.getStatusLabel(s); }

  ngOnInit(): void {
    this.particles = this.tcService.generateParticles();
    this.initSearchStream();
    this.initCancelStream();
    this.handleQueryParams();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  private initSearchStream(): void {
    this.searchTrigger$.pipe(
      filter(id => !!id.trim()),
      map(val => this.tcService.extractUuid(val)),
      tap(() => { this.state.set('loading'); this.errorMessage.set(''); }),
      switchMap(id =>
        this.tcService.checkStatus(id).pipe(
          catchError(() => {
            this.state.set('error');
            this.errorMessage.set('ბილეთი ვერ მოიძებნა');
            return EMPTY;
          })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(ticket => {
      this.ticket.set(ticket);
      this.state.set('success');
    });
  }

  private initCancelStream(): void {
    this.cancelTrigger$.pipe(
      tap(() => {
        this.cancelLoading.set(true);
        this.showModal.set(false);
      }),
      switchMap(id =>
        this.tcService.cancelTicket(id).pipe(
          catchError(() => {
            this.errorMessage.set('ბილეთი წარმატებით გაუქმდა');
            this.state.set('error');
            this.cancelLoading.set(false);
            this.showModal.set(false);
            return EMPTY;
          })
        )
      ),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.cancelledId.set(this.ticket()?.id ?? '');
      this.cancelLoading.set(false);
      this.state.set('cancelled');
      this.tcService.clearSessionData();
      this.service.ticketCancelled$.next(true);
    });
  }

  private handleQueryParams(): void {
    this.route.queryParams.pipe(
      map(p => p['id'] || p['ticketId']),
      filter(Boolean),
      takeUntil(this.destroy$)
    ).subscribe((id: string) => {
      this.ticketControl.setValue(id);
      this.search();
    });
  }


  search(): void {
    if (this.ticketControl.invalid) {
      this.errorMessage.set('გთხოვთ შეიყვანოთ ბილეთის ნომერი');
      return;
    }
    this.searchTrigger$.next(this.ticketControl.value);
  }

  openModal(): void  { this.showModal.set(true); }
  closeModal(): void { if (!this.cancelLoading()) this.showModal.set(false); }

  confirmCancel(): void {
    const id = this.ticket()?.id;
    if (id) this.cancelTrigger$.next(id);
  }

  reset(): void {
    this.ticketControl.reset();
    this.state.set('idle');
    this.ticket.set(null);
    this.errorMessage.set('');
    this.cancelledId.set('');
  }

  printTicket(): void { window.print(); }
}