import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BookingService, RouteInfo, Passenger, Vagon, Seat, SelectedSeat } from './booking.service';

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

  vagons: Vagon[]       = [];
  loadingVagons         = true;

  showVagonPopup        = false;
  showSeatPopup         = false;
  activeVagon: Vagon | null = null;
  activePassengerIdx    = -1;

  selectedSeats: (SelectedSeat | null)[] = [];

  submitted   = false;
  phoneError  = '';

  readonly ROWS        = [1,2,3,4,5,6,7,8,9,10];
  readonly LEFT_COLS   = ['A','B'];
  readonly RIGHT_COLS  = ['C','D'];
  readonly Boolean     = Boolean;

  readonly VAGON_COLORS: Record<string, string> = {
    'II კლასი':     '#e74c3c',
    'I კლასი':      '#c0392b',
    'ბიზნეს კლასი': '#922b21',
  };

  get passengerCount(): number { return this.route.passengerCount || 1; }

  get formattedDate(): string { return this.bookingService.formatDate(this.route.date); }

  get totalPrice(): number {
    return this.selectedSeats.filter(Boolean).reduce((s, x) => s + x!.seat.price, 0);
  }

  get activeVagonColor(): string {
    return this.VAGON_COLORS[this.activeVagon?.name ?? ''] || '#e74c3c';
  }

  constructor(private bookingService: BookingService) {}

  ngOnInit(): void {
    this.route         = this.bookingService.loadRouteInfo();
    const n            = this.passengerCount;
    this.passengers    = Array.from({ length: n }, () => ({ firstName: '', lastName: '', personalId: '' }));
    this.selectedSeats = new Array(n).fill(null);
    this.loadVagons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  loadVagons(): void {
    if (!this.route?.apiId) { this.loadingVagons = false; return; }

    this.bookingService.getVagons(this.route.apiId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => { this.vagons = data; this.loadingVagons = false; },
        error: ()   => { this.loadingVagons = false; },
      });
  }


  openVagonPopup(pidx: number): void {
    this.activePassengerIdx = pidx;
    this.showVagonPopup     = true;
    this.showSeatPopup      = false;
  }

  closeVagonPopup(): void { this.showVagonPopup = false; }

  selectVagon(vagon: Vagon): void {
    this.activeVagon    = vagon;
    this.showVagonPopup = false;
    this.showSeatPopup  = true;
  }

  backToVagons(): void  { this.showSeatPopup = false; this.showVagonPopup = true; }
  closeSeatPopup(): void { this.showSeatPopup = false; this.activeVagon = null; }


  freeCount(vagon: Vagon): number {
    return this.bookingService.freeCount(vagon, this.selectedSeats, this.activePassengerIdx);
  }

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
    this.selectedSeats[pidx] =
      this.selectedSeats[pidx]?.seat.seatId === seat.seatId
        ? null
        : { seat, vagonId: this.activeVagon!.id, vagonName: this.activeVagon!.name };
  }

  clearSeat(idx: number): void { this.selectedSeats[idx] = null; }


  isValidId(id: string): boolean { return this.bookingService.isValidId(id); }

  limitId(idx: number): void {
    this.passengers[idx].personalId = this.passengers[idx].personalId.replace(/\D/g, '').slice(0, 11);
  }

  validatePhone(): void {
    const result = this.bookingService.validatePhone(this.contact.phone);
    this.contact.phone = result.value;
    this.phoneError    = result.error;
  }

  canSubmit(): boolean {
    return this.bookingService.canSubmit(this.contact, this.passengers, this.selectedSeats);
  }


  submit(): void {
    this.submitted = true;
    if (!this.canSubmit()) return;
    this.bookingService.saveAndNavigate(this.route, this.contact, this.passengers, this.selectedSeats);
  }
}