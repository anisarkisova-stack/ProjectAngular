import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Seat {
  seatId: string;
  number: string;
  price: number;
  isOccupied: boolean;
  vagonId: number;
}

interface Vagon {
  id: number;
  trainId: number;
  trainNumber: number;
  name: string;
  seats: Seat[];
}

interface RouteInfo {
  trainId: string;
  trainName: string;
  from: string;
  to: string;
  depTime: string;
  arrTime: string;
  date: string;
  passengerCount: number;
  apiId: number;
  wagonDay: string;
}

interface Passenger {
  firstName: string;
  lastName: string;
  personalId: string;
}

interface SelectedSeat {
  seat: Seat;
  vagonId: number;
  vagonName: string;
}

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './booking.html',
  styleUrl: './booking.scss',
})
export class Booking implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  route: RouteInfo = {} as RouteInfo;
  contact = { email: '', phone: '' };
  passengers: Passenger[] = [];

  vagons: Vagon[] = [];
  loadingVagons = true;

  showVagonPopup = false;
  showSeatPopup = false;
  activeVagon: Vagon | null = null;
  activePassengerIdx = -1;

  selectedSeats: (SelectedSeat | null)[] = [];

  submitted = false;
  phoneError = '';

  readonly ROWS = [1,2,3,4,5,6,7,8,9,10];
  readonly LEFT_COLS  = ['A','B'];
  readonly RIGHT_COLS = ['C','D'];
  readonly Boolean = Boolean;

  readonly VAGON_COLORS: Record<string, string> = {
    'II კლასი':      '#e74c3c',
    'I კლასი':       '#c0392b',
    'ბიზნეს კლასი':  '#922b21',
  };

  get passengerCount(): number { return this.route.passengerCount || 1; }

  get formattedDate(): string {
    if (!this.route.date) return '—';
    const p = this.route.date.split('-').map(Number);
    if (p.length === 3) return new Date(p[0], p[1]-1, p[2]).toLocaleDateString('ka-GE', { day:'numeric', month:'short', year:'numeric' });
    return new Date(this.route.date).toLocaleDateString('ka-GE', { day:'numeric', month:'short', year:'numeric' });
  }

  get totalPrice(): number {
    return this.selectedSeats.filter(Boolean).reduce((s, x) => s + x!.seat.price, 0);
  }

  get activeVagonColor(): string {
    if (!this.activeVagon) return '#e74c3c';
    return this.VAGON_COLORS[this.activeVagon.name] || '#e74c3c';
  }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    try {
      const state = JSON.parse(sessionStorage.getItem('bookingState') || '{}');
      this.route = state.route || {} as RouteInfo;
    } catch { this.route = {} as RouteInfo; }

    const n = this.passengerCount;
    this.passengers    = Array.from({ length: n }, () => ({ firstName: '', lastName: '', personalId: '' }));
    this.selectedSeats = new Array(n).fill(null);

    this.loadVagons();
  }

  loadVagons(): void {
    if (!this.route?.apiId) { this.loadingVagons = false; return; }
    this.http.get<Vagon[]>('https://railway.stepprojects.ge/api/vagons')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.vagons = data.filter(v => v.trainId === this.route.apiId); this.loadingVagons = false; },
        error: ()   => { this.loadingVagons = false; },
      });
  }

  freeCount(vagon: Vagon): number {
    if (!vagon.seats) return 0;
    const takenIds = this.selectedSeats
      .filter((s, i) => s && s.vagonId === vagon.id && i !== this.activePassengerIdx)
      .map(s => s!.seat.seatId);
    return vagon.seats.filter(s => !s.isOccupied && !takenIds.includes(s.seatId)).length;
  }

  openVagonPopup(pidx: number): void {
    this.activePassengerIdx = pidx;
    this.showVagonPopup = true;
    this.showSeatPopup  = false;
  }

  closeVagonPopup(): void { this.showVagonPopup = false; }

  selectVagon(vagon: Vagon): void {
    this.activeVagon    = vagon;
    this.showVagonPopup = false;
    this.showSeatPopup  = true;
  }

  backToVagons(): void { this.showSeatPopup = false; this.showVagonPopup = true; }

  closeSeatPopup(): void { this.showSeatPopup = false; this.activeVagon = null; }

  findSeat(row: number, col: string): Seat | null {
    if (!this.activeVagon?.seats) return null;
    return this.activeVagon.seats.find(s => s.number === `${row}${col}`) ?? null;
  }

  getSeatClass(row: number, col: string): string {
    const seat = this.findSeat(row, col);
    if (!seat) return 'empty';
    if (seat.isOccupied) return 'occ';
    const pidx = this.activePassengerIdx;
    if (this.selectedSeats[pidx]?.seat.seatId === seat.seatId) return 'mine';
    if (this.selectedSeats.some((s, i) => s && i !== pidx && s.seat.seatId === seat.seatId)) return 'occ';
    return 'free';
  }

  pickSeat(row: number, col: string): void {
    const seat = this.findSeat(row, col);
    if (!seat || seat.isOccupied) return;
    const pidx = this.activePassengerIdx;
    if (this.selectedSeats.some((s, i) => s && i !== pidx && s.seat.seatId === seat.seatId)) return;
    if (this.selectedSeats[pidx]?.seat.seatId === seat.seatId) {
      this.selectedSeats[pidx] = null;
    } else {
      this.selectedSeats[pidx] = { seat, vagonId: this.activeVagon!.id, vagonName: this.activeVagon!.name };
    }
  }

  clearSeat(idx: number): void { this.selectedSeats[idx] = null; }

  isValidId(id: string): boolean {
    return /^\d{11}$/.test(id || '');
  }

  limitId(idx: number): void {
    this.passengers[idx].personalId = this.passengers[idx].personalId.replace(/\D/g, '').slice(0, 11);
  }

  validatePhone(): void {
    const d = this.contact.phone.replace(/\D/g, '');
    if (d.length > 9) this.contact.phone = d.slice(0,9);
    this.phoneError = d.length > 0 && d.length < 9 ? 'ტელეფონის ნომერი უნდა იყოს 9 ციფრი' : '';
  }

  canSubmit(): boolean {
    const d = this.contact.phone.replace(/\D/g, '');
    return d.length === 9 && this.contact.email.includes('@') &&
      this.selectedSeats.every(Boolean) &&
      this.passengers.every(p => p.firstName && p.lastName && this.isValidId(p.personalId));
  }

  submit(): void {
  this.submitted = true;
  if (!this.canSubmit()) return;

  const passengers = this.passengers.map((p, i) => ({
    name:     p.firstName,
    surname:  p.lastName,
    idNum:    p.personalId,
    seatId:   this.selectedSeats[i]?.seat.seatId   || '',
    seatApiId:this.selectedSeats[i]?.seat.seatId   || '',
    price:    this.selectedSeats[i]?.seat.price     ?? 0,
    vagonId:  this.selectedSeats[i]?.vagonId        ?? 0,
  }));

  const state = {
    route:      this.route,
    contact:    this.contact,
    passengers: passengers,
  };

  sessionStorage.setItem('bookingState', JSON.stringify(state));
  this.router.navigate(['/register']);
}

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }
}