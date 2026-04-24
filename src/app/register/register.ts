import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface BookingState {
  route?: { apiId?: number; date?: string };
  contact?: { email?: string; phone?: string };
  passengers?: { seatId?: string; name?: string; surname?: string; idNum?: string }[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  readonly BASE_URL = 'https://railway.stepprojects.ge';

  cardNumber = '';
  expiry = '';
  cvv = '';
  cardHolder = '';

  totalAmount = 'იტვირთება...';
  errorMsg = '';
  loading = false;
  success = false;

  private bookingState: BookingState = {};

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    try {
      this.bookingState = JSON.parse(sessionStorage.getItem('bookingState') || '{}');
    } catch { this.bookingState = {}; }

    this.loadAmount();
  }

  loadAmount(): void {
    const passengers = this.bookingState.passengers || [];
    const total = passengers.reduce((s, p: any) => s + (p.price || 0), 0);

    if (total > 0) {
      this.totalAmount = total.toFixed(2) + '₾';
      return;
    }

    this.http.get<any[]>(this.BASE_URL + '/api/tickets')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          if (Array.isArray(data) && data.length) {
            const sum = data.reduce((a, t) => a + (t.price || t.amount || t.totalPrice || 0), 0);
            this.totalAmount = sum.toFixed(2) + '₾';
          } else {
            this.totalAmount = '–.–₾';
          }
        },
        error: () => { this.totalAmount = '–.–₾'; }
      });
  }

  formatCardNumber(): void {
    const val = this.cardNumber.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = val.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(): void {
    const val = this.expiry.replace(/\D/g, '').substring(0, 6);
    this.expiry = val.length > 2 ? val.substring(0, 2) + '/' + val.substring(2) : val;
  }

  handlePayment(): void {
    this.errorMsg = '';

    if (this.cardNumber.replace(/\s/g, '').length < 16)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ სწორი ბარათის ნომერი (16 ციფრი)');
    if (this.expiry.length < 5)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ ბარათის ვადა (MM/YY)');
    if (this.cvv.length < 3)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ CVC/CVV კოდი');

    this.loading = true;
    const savedCard = this.cardNumber;
    const payload = this.buildPayload();

    this.http.post<any>(this.BASE_URL + '/api/tickets/register', payload, {
      headers: { 'Content-Type': 'application/json', 'accept': 'text/plain' },
      responseType: 'text' as any
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          let ticketId = '';
          try { ticketId = JSON.parse(res)?.ticketId || JSON.parse(res)?.id || ''; } catch { }
          if (!ticketId) {
            const match = (res as string).match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            ticketId = match ? match[0] : (res as string).trim();
          }
          if (!ticketId) { this.loading = false; this.errorMsg = 'ტიკეტის ID ვერ მოიძებნა'; return; }
          this.checkStatus(ticketId, savedCard);
        },
        error: err => { this.loading = false; this.errorMsg = 'შეცდომა: ' + (err.message || 'რეგისტრაციის შეცდომა'); }
      });
  }

  private checkStatus(ticketId: string, savedCard: string): void {
    this.http.get<any>(this.BASE_URL + '/api/tickets/checkstatus/' + ticketId)
      .pipe(takeUntil(this.destroy$))
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
          this.confirmTicket(ticketId, savedCard);
        },
        error: err => { this.loading = false; this.errorMsg = 'სტატუსის შეცდომა: ' + err.message; }
      });
  }

  private confirmTicket(ticketId: string, savedCard: string): void {
    this.http.post<any>(this.BASE_URL + '/api/tickets/confirm/' + ticketId, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          sessionStorage.setItem('lastTicketId', ticketId);
          sessionStorage.setItem('lastCardMasked', savedCard.replace(/\d(?=\d{4})/g, '*').trim());
          sessionStorage.removeItem('bookingState');
          this.loading = false;
          this.router.navigate(['/invois']);
        },
        error: () => {
          sessionStorage.setItem('lastTicketId', ticketId);
          sessionStorage.removeItem('bookingState');
          this.loading = false;
          this.router.navigate(['/invois']);
        }
      });
  }

private buildPayload(): object {
  const route   = this.bookingState.route   || {};
  const contact = this.bookingState.contact || {};
  const people  = (this.bookingState.passengers || []).map((p: any) => ({
    seatId:          p.seatId || '',
    name:            p.name    || '',
    surname:         p.surname || '',
    idNumber:        p.idNum   || '',
    status:          'adult',
    payoutCompleted: false
  }));

  return {
    trainId:     route.apiId || 0,
    date:        route.date ? new Date(route.date).toISOString() : new Date().toISOString(),
    email:       contact.email || '',
    phoneNumber: contact.phone || '',
    people:      people.length ? people : [{ seatId: '', name: '', surname: '', idNumber: '', status: 'adult', payoutCompleted: false }]
  };
}
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}