import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Seat   { number?: string | number; }
export interface Person { name?: string; surname?: string; idNumber?: string; seat?: Seat; status?: string; }
export interface Train  { from?: string; to?: string; departure?: string; arrive?: string; }
export interface Ticket {
  id: string;
  confirmed: boolean;
  date?: string;
  email?: string;
  phone?: string;
  ticketPrice?: number;
  train?: Train;
  persons?: Person[];
}

const BASE = 'https://railway.stepprojects.ge';

@Injectable({
  providedIn: 'root',
})
export class TicketCheckService {

  constructor(private http: HttpClient) {}


  checkStatus(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${BASE}/api/tickets/checkstatus/${id}`);
  }

  cancelTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/api/tickets/cancel/${id}`, {
      headers: { accept: 'text/plain' },
    });
  }


  clearSessionData(): void {
    sessionStorage.removeItem('invoiceData');
    sessionStorage.removeItem('bookingState');
    sessionStorage.removeItem('lastTicketId');
  }


  extractUuid(val: string): string {
    const m = val.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return m ? m[0] : val.trim();
  }

  getToday(): string {
    const d = new Date();
    return `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;
  }

  getSeatNumber(p: Person): string   { return p?.seat?.number?.toString() ?? '—'; }
  getStatusClass(s?: string): string { return s === 'registered' ? 'status--registered' : 'status--cancelled'; }
  getStatusLabel(s?: string): string { return s === 'registered' ? 'რეგ.' : (s ?? '—'); }

  generateParticles(): string[] {
    return Array.from({ length: 12 }, () => {
      const size = Math.random() * 60 + 20;
      return `width:${size}px; height:${size}px; left:${Math.random() * 100}%; animation-duration:${Math.random() * 20 + 15}s; animation-delay:${Math.random() * 10}s;`;
    });
  }
}