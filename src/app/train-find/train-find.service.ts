import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Train {
  id: number;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrive: string;
  date: string;
}

export interface SearchParams {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  date: string;
  passengers: number;
}

const GEO_DAYS = ['კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'];

@Injectable({
  providedIn: 'root',
})
export class TrainFindService {

  constructor(private http: HttpClient, private router: Router) {}


  getSearchParams(): SearchParams {
    try {
      return JSON.parse(sessionStorage.getItem('trainSearch') || '{}');
    } catch {
      return {} as SearchParams;
    }
  }

  saveBookingAndNavigate(train: Train, params: SearchParams): void {
    sessionStorage.setItem('bookingState', JSON.stringify({
      route: {
        trainId:        '#' + train.number,
        trainName:      train.name,
        from:           train.from,
        to:             train.to,
        depTime:        train.departure,
        arrTime:        train.arrive,
        date:           params.date        || '',
        passengerCount: Number(params.passengers) || 1,
        apiId:          train.id,
        wagonDay:       train.date         || '',
      },
      contact:    { email: '', phone: '' },
      passengers: [],
    }));

    this.router.navigate(['/booking']);
  }


  getFilteredTrains(params: SearchParams): Observable<Train[]> {
    const chosenDay = this.getChosenDay(params.date);

    return this.http.get<Train[]>('https://railway.stepprojects.ge/api/trains').pipe(
      map(data => data.filter(t =>
        (!params.fromName || t.from === params.fromName) &&
        (!params.toName   || t.to   === params.toName)   &&
        (!chosenDay       || t.date  === chosenDay)
      ))
    );
  }


  formatDate(date: string): string {
    if (!date) return '—';
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('ka-GE', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

  private getChosenDay(date: string): string | null {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    return GEO_DAYS[new Date(y, m - 1, d).getDay()];
  }
}