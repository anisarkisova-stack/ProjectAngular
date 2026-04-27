import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

import { InvoisService, PassengerRow } from './invois.service';

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

  constructor(private invoisService: InvoisService) {}

  ngOnInit(): void {
    this.issueDate  = this.invoisService.getIssueDate();
    this.ticketId   = this.invoisService.getTicketId();
    this.cardMasked = this.invoisService.getCardMasked();

    const { state, ticketId } = this.invoisService.loadState();
    if (ticketId) this.ticketId = ticketId;
    if (!state) return;

    const r = state.route;
    const c = state.contact;

    this.from       = [r.from, r.depTime ? r.depTime + '-ზე' : ''].filter(Boolean).join(' ') || '—';
    this.to         = [r.to,   r.arrTime ? r.arrTime + '-ზე' : ''].filter(Boolean).join(' ') || '—';
    this.travelDate = this.invoisService.formatDate(r.date);
    this.email      = c.email || '—';
    this.phone      = c.phone || '—';
    this.cardName   = c.email ? c.email.split('@')[0].substring(0, 8) : '—';
    this.passengers = state.passengers;

    const sum = state.passengers.reduce((s, p) => s + (Number(p.price) || 0), 0);
    this.totalVal = (state.invoice?.total || sum).toFixed(2);
  }

  print(): void { window.print(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}