import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, EMPTY } from 'rxjs';
import { switchMap, takeUntil, tap, catchError, filter, map } from 'rxjs/operators';
import { CartService } from '../auth/cart-service';

interface Seat   { number?: string | number; }
interface Person { name?: string; surname?: string; idNumber?: string; seat?: Seat; status?: string; }
interface Train  { from?: string; to?: string; departure?: string; arrive?: string; }
interface Ticket {
  id: string;
  confirmed: boolean;
  date?: string;
  email?: string;
  phone?: string;
  ticketPrice?: number;
  train?: Train;
  persons?: Person[];
}

type PageState = 'idle' | 'loading' | 'success' | 'cancelled' | 'error';

const BASE = 'https://railway.stepprojects.ge';

@Component({
  selector: 'app-ticket-check',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-check.html',
  styleUrls: ['./ticket-check.scss'],
})
export class TicketCheck implements OnInit, OnDestroy {
  private readonly http     = inject(HttpClient);
  private readonly route    = inject(ActivatedRoute);
  private readonly service  = inject(CartService);
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

  ngOnInit(): void {
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
      map(val => this.extractUuid(val)),
      tap(() => { this.state.set('loading'); this.errorMessage.set(''); }),
      switchMap(id =>
        this.http.get<Ticket>(`${BASE}/api/tickets/checkstatus/${id}`).pipe(
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
        this.showModal.set(false); // პოპაპი დაუყოვნებლივ დახურე
      }),
      switchMap(id =>
        this.http.delete<void>(`${BASE}/api/tickets/cancel/${id}`, {
          headers: { accept: 'text/plain' },
        }).pipe(
          catchError(() => {
            this.errorMessage.set('გაუქმება ვერ მოხერხდა');
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
      sessionStorage.removeItem('invoiceData');
      sessionStorage.removeItem('bookingState');
      sessionStorage.removeItem('lastTicketId');
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

  private extractUuid(val: string): string {
    const m = val.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0] : val.trim();
  }

  get today(): string {
    const d = new Date();
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }

  getSeatNumber(p: Person): string   { return p?.seat?.number?.toString() ?? '—'; }
  getStatusClass(s?: string): string { return s === 'registered' ? 'status--registered' : 'status--cancelled'; }
  getStatusLabel(s?: string): string { return s === 'registered' ? 'რეგ.' : (s ?? '—'); }
}