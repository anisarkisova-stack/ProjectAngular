import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface BookingState {
  route?: { apiId?: number; date?: string };
  contact?: { email?: string; phone?: string };
  passengers?: { seatId?: string; name?: string; surname?: string; idNum?: string; price?: number }[];
}

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private readonly BASE_URL = 'https://railway.stepprojects.ge';

  constructor(private http: HttpClient, private router: Router) {}


  loadBookingState(): BookingState {
    try {
      return JSON.parse(sessionStorage.getItem('bookingState') || '{}');
    } catch {
      return {};
    }
  }


  resolveAmount(
    bookingState: BookingState,
    destroy$: Subject<void>,
    onSuccess: (amount: string) => void,
    onError: () => void
  ): void {
    const passengers = bookingState.passengers || [];
    const total = passengers.reduce((s, p: any) => s + (p.price || 0), 0);

    if (total > 0) {
      onSuccess(total.toFixed(2) + '₾');
      return;
    }

    this.http.get<any[]>(this.BASE_URL + '/api/tickets')
      .pipe(takeUntil(destroy$))
      .subscribe({
        next: data => {
          if (Array.isArray(data) && data.length) {
            const sum = data.reduce((a, t) => a + (t.price || t.amount || t.totalPrice || 0), 0);
            onSuccess(sum.toFixed(2) + '₾');
          } else {
            onError();
          }
        },
        error: () => onError(),
      });
  }


  registerTicket(
    bookingState: BookingState,
    destroy$: Subject<void>,
    onSuccess: (ticketId: string) => void,
    onError: (msg: string) => void
  ): void {
    const payload = this.buildPayload(bookingState);

    this.http.post<any>(this.BASE_URL + '/api/tickets/register', payload, {
      headers: { 'Content-Type': 'application/json', accept: 'text/plain' },
      responseType: 'text' as any,
    })
      .pipe(takeUntil(destroy$))
      .subscribe({
        next: (res: any) => {
          let ticketId = '';
          try { ticketId = JSON.parse(res)?.ticketId || JSON.parse(res)?.id || ''; } catch { }
          if (!ticketId) {
            const match = (res as string).match(
              /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
            );
            ticketId = match ? match[0] : (res as string).trim();
          }
          if (!ticketId) { onError('ტიკეტის ID ვერ მოიძებნა'); return; }
          onSuccess(ticketId);
        },
        error: err => onError('შეცდომა: ' + (err.message || 'რეგისტრაციის შეცდომა')),
      });
  }

  checkStatus(
    ticketId: string,
    destroy$: Subject<void>,
    onSuccess: () => void,
    onError: (msg: string) => void
  ): void {
    this.http.get<any>(this.BASE_URL + '/api/tickets/checkstatus/' + ticketId)
      .pipe(takeUntil(destroy$))
      .subscribe({
        next: status => {
          sessionStorage.setItem('invoiceData', JSON.stringify({
            ticketId:    status.id,
            ticketPrice: status.ticketPrice,
            confirmed:   status.confirmed,
            date:        status.date,
            train: {
              name:      status.train?.name,
              from:      status.train?.from,
              to:        status.train?.to,
              departure: status.train?.departure,
              arrive:    status.train?.arrive,
              number:    status.train?.number,
            },
            persons: (status.persons || []).map((p: any) => ({
              name:     p.name,
              surname:  p.surname,
              idNumber: p.idNumber,
              seatNum:  p.seat?.number ?? '—',
              vagonId:  p.seat?.vagonId ?? '—',
              price:    p.seat?.price ?? 0,
            })),
            email: status.email,
            phone: status.phone,
          }));
          onSuccess();
        },
        error: err => onError('სტატუსის შეცდომა: ' + err.message),
      });
  }

  confirmTicket(
    ticketId: string,
    savedCard: string,
    destroy$: Subject<void>,
    onDone: () => void
  ): void {
this.http.get<any>(this.BASE_URL + '/api/tickets/confirm/' + ticketId, {})   
   .pipe(takeUntil(destroy$))
      .subscribe({
        next: () => this.finalizeAndNavigate(ticketId, savedCard, onDone),
        error: ()  => this.finalizeAndNavigate(ticketId, savedCard, onDone),
      });
  }


  private finalizeAndNavigate(ticketId: string, savedCard: string, onDone: () => void): void {
    sessionStorage.setItem('lastTicketId', ticketId);
    sessionStorage.setItem('lastCardMasked', savedCard.replace(/\d(?=\d{4})/g, '*').trim());
    sessionStorage.removeItem('bookingState');
    onDone();
    this.router.navigate(['/invois']);
  }

  private buildPayload(bookingState: BookingState): object {
    const route   = bookingState.route   || {};
    const contact = bookingState.contact || {};
    const people  = (bookingState.passengers || []).map((p: any) => ({
      seatId:          p.seatId  || '',
      name:            p.name    || '',
      surname:         p.surname || '',
      idNumber:        p.idNum   || '',
      status:          'adult',
      payoutCompleted: false,
    }));

    return {
      trainId:     route.apiId || 0,
      date:        route.date ? new Date(route.date).toISOString() : new Date().toISOString(),
      email:       contact.email || '',
      phoneNumber: contact.phone || '',
      people: people.length
        ? people
        : [{ seatId: '', name: '', surname: '', idNumber: '', status: 'adult', payoutCompleted: false }],
    };
  }
}