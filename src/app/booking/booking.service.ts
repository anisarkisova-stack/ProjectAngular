import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Seat {
  seatId: string;
  number: string;
  price: number;
  isOccupied: boolean;
  vagonId: number;
}

export interface Vagon {
  id: number;
  trainId: number;
  trainNumber: number;
  name: string;
  seats: Seat[];
}

export interface RouteInfo {
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

export interface Passenger {
  firstName: string;
  lastName: string;
  personalId: string;
}

export interface SelectedSeat {
  seat: Seat;
  vagonId: number;
  vagonName: string;
}

@Injectable({
  providedIn: 'root',
})
export class BookingService {

  constructor(private http: HttpClient, private router: Router) {}


  loadRouteInfo(): RouteInfo {
    try {
      const state = JSON.parse(sessionStorage.getItem('bookingState') || '{}');
      return state.route || {} as RouteInfo;
    } catch {
      return {} as RouteInfo;
    }
  }

  saveAndNavigate(
    route: RouteInfo,
    contact: { email: string; phone: string },
    passengers: Passenger[],
    selectedSeats: (SelectedSeat | null)[]
  ): void {
    const mappedPassengers = passengers.map((p, i) => ({
      name:      p.firstName,
      surname:   p.lastName,
      idNum:     p.personalId,
      seatId:    selectedSeats[i]?.seat.seatId  || '',
      seatApiId: selectedSeats[i]?.seat.seatId  || '',
      price:     selectedSeats[i]?.seat.price   ?? 0,
      vagonId:   selectedSeats[i]?.vagonId      ?? 0,
    }));

    sessionStorage.setItem('bookingState', JSON.stringify({
      route,
      contact,
      passengers: mappedPassengers,
    }));

    this.router.navigate(['/register']);
  }


  getVagons(trainId: number): Observable<Vagon[]> {
    return this.http
      .get<Vagon[]>('https://railway.stepprojects.ge/api/vagons')
      .pipe(map(data => data.filter(v => v.trainId === trainId)));
  }


  formatDate(date: string): string {
    if (!date) return '—';
    const p = date.split('-').map(Number);
    const d = p.length === 3
      ? new Date(p[0], p[1] - 1, p[2])
      : new Date(date);
    return d.toLocaleDateString('ka-GE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  freeCount(
    vagon: Vagon,
    selectedSeats: (SelectedSeat | null)[],
    activePassengerIdx: number
  ): number {
    if (!vagon.seats) return 0;
    const takenIds = selectedSeats
      .filter((s, i) => s && s.vagonId === vagon.id && i !== activePassengerIdx)
      .map(s => s!.seat.seatId);
    return vagon.seats.filter(s => !s.isOccupied && !takenIds.includes(s.seatId)).length;
  }

  isValidId(id: string): boolean {
    return /^\d{11}$/.test(id || '');
  }

  validatePhone(phone: string): { value: string; error: string } {
    const d = phone.replace(/\D/g, '');
    return {
      value: d.length > 9 ? d.slice(0, 9) : phone,
      error: d.length > 0 && d.length < 9 ? 'ტელეფონის ნომერი უნდა იყოს 9 ციფრი' : '',
    };
  }

  canSubmit(
    contact: { email: string; phone: string },
    passengers: Passenger[],
    selectedSeats: (SelectedSeat | null)[]
  ): boolean {
    const d = contact.phone.replace(/\D/g, '');
    return (
      d.length === 9 &&
      contact.email.includes('@') &&
      selectedSeats.every(Boolean) &&
      passengers.every(p => p.firstName && p.lastName && this.isValidId(p.personalId))
    );
  }
}