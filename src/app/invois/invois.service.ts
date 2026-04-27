import { Injectable } from '@angular/core';

export interface PassengerRow {
  name: string;
  surname: string;
  idNumber: string;
  seatNum: string;
  vagonName: string;
  price: number;
}

export interface InvoiceState {
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

@Injectable({
  providedIn: 'root',
})
export class InvoisService {
  private readonly DAYS = [
    'კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი',
  ];
  private readonly MONTHS = [
    'იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
    'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი',
  ];


  getTicketId(): string {
    try { return sessionStorage.getItem('lastTicketId') || '—'; } catch { return '—'; }
  }

  getCardMasked(): string {
    try { return sessionStorage.getItem('lastCardMasked') || '—'; } catch { return '—'; }
  }

  loadState(): { state: InvoiceState | null; ticketId: string | null } {
    try {
      const inv = sessionStorage.getItem('invoiceData');
      if (inv) {
        const d: InvoiceData = JSON.parse(inv);
        return {
          ticketId: d.ticketId || null,
          state: {
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
            invoice: { total: d.ticketPrice },
          },
        };
      }

      const raw = sessionStorage.getItem('bookingState');
      return { ticketId: null, state: raw ? JSON.parse(raw) : null };
    } catch {
      return { ticketId: null, state: null };
    }
  }


  formatDate(date: string): string {
    if (!date || !date.includes('-') || date.length <= 6) return date || '—';
    try {
      const d = new Date(date);
      return `${this.DAYS[d.getDay()]} ${d.getDate()} ${this.MONTHS[d.getMonth()]}`;
    } catch {
      return date;
    }
  }

  getIssueDate(): string {
    const now = new Date();
    return `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
  }
}