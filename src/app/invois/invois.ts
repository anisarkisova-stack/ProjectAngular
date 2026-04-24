import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

interface TrainInfo {
  name: string;
  from: string;
  to: string;
  departure: string;
  arrive: string;
  number: string;
}

interface PersonRaw {
  name: string;
  surname: string;
  idNumber: string;
  seatNum: string;
  vagonId: string | number;
  price: number;
}

interface InvoiceData {
  ticketId: string;
  ticketPrice: number;
  confirmed: boolean;
  date: string;
  train: TrainInfo;
  persons: PersonRaw[];
  email: string;
  phone: string;
}

interface PassengerRow {
  name: string;
  surname: string;
  idNumber: string;
  seatNum: string;
  vagonName: string;
  price: number;
}

interface InvoiceState {
  route: {
    trainId: string;
    trainName: string;
    from: string;
    to: string;
    depTime: string;
    arrTime: string;
    date: string;
  };
  contact: { email: string; phone: string };
  passengers: PassengerRow[];
  invoice: { total: number };
}

@Component({
  selector: 'app-invois',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './invois.html',
  styleUrl: './invois.scss',
})
export class Invois implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  ticketId   = '—';
  cardMasked = '—';
  issueDate  = '—';
  from       = '—';
  to         = '—';
  travelDate = '—';
  email      = '—';
  phone      = '—';
  cardName   = '—';
  totalVal   = '0';

  passengers: PassengerRow[] = [];

  private readonly DAYS = [
    'კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'
  ];
  private readonly MONTHS = [
    'იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
    'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი'
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    const now = new Date();
    this.issueDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    try { this.ticketId   = sessionStorage.getItem('lastTicketId')   || '—'; } catch (_) {}
    try { this.cardMasked = sessionStorage.getItem('lastCardMasked') || '—'; } catch (_) {}

    const state = this.loadState();
    if (!state) return;

    const r = state.route;
    const c = state.contact;

    this.from       = [r.from, r.depTime ? r.depTime + '-ზე' : ''].filter(Boolean).join(' ') || '—';
    this.to         = [r.to,   r.arrTime ? r.arrTime + '-ზე' : ''].filter(Boolean).join(' ') || '—';
    this.travelDate = this.formatDate(r.date);
    this.email      = c.email || '—';
    this.phone      = c.phone || '—';
    this.cardName   = c.email ? c.email.split('@')[0].substring(0, 8) : '—';
    this.passengers = state.passengers;

    const sum = state.passengers.reduce((s, p) => s + (Number(p.price) || 0), 0);
    this.totalVal = (state.invoice?.total || sum).toFixed(2);
  }

  private loadState(): InvoiceState | null {
    try {
      const inv = sessionStorage.getItem('invoiceData');
      if (inv) {
        const d: InvoiceData = JSON.parse(inv);
        if (d.ticketId) this.ticketId = d.ticketId;
        return {
          route: {
            trainId:   d.train.number,
            trainName: d.train.name,
            from:      d.train.from,
            to:        d.train.to,
            depTime:   d.train.departure,
            arrTime:   d.train.arrive,
            date:      d.date,
          },
          contact: { email: d.email || '', phone: d.phone || '' },
          passengers: (d.persons || []).map(p => ({
            name:      p.name,
            surname:   p.surname,
            idNumber:  p.idNumber,
            seatNum:   p.seatNum,
            vagonName: 'ვაგონი ' + p.vagonId,
            price:     p.price,
          })),
          invoice: { total: d.ticketPrice }
        };
      }
      const raw = sessionStorage.getItem('bookingState');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  private formatDate(date: string): string {
    if (!date || date.indexOf('-') === -1 || date.length <= 6) return date || '—';
    try {
      const d = new Date(date);
      return `${this.DAYS[d.getDay()]} ${d.getDate()} ${this.MONTHS[d.getMonth()]}`;
    } catch (_) {
      return date;
    }
  }

  print(): void { window.print(); }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}