import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, shareReplay } from 'rxjs';

export interface Station {
  id: number;
  name: string;
}

export interface TrainSearch {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  date: string;       
  passengers: number;
}

@Injectable({
  providedIn: 'root',
})
export class MainService {
  private readonly API_URL = 'https://railway.stepprojects.ge/api/stations';
  private readonly STORAGE_KEY = 'trainSearch';

  private stations$!: Observable<Station[]>;

  constructor(private http: HttpClient, private router: Router) {
    this.stations$ = this.http
      .get<Station[]>(this.API_URL)
      .pipe(shareReplay(1));
  }


  getStations(): Observable<Station[]> {
    return this.stations$;
  }


  saveAndNavigate(
    from: Station,
    to: Station,
    date: Date,
    passengers: number
  ): void {
    const payload: TrainSearch = {
      fromId: from.id,
      toId: to.id,
      fromName: from.name,
      toName: to.name,
      date: this.formatDate(date),
      passengers,
    };

    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
    this.router.navigate(['/train-find']);
  }

  getSearch(): TrainSearch | null {
    const raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as TrainSearch;
    } catch {
      return null;
    }
  }

  clearSearch(): void {
    sessionStorage.removeItem(this.STORAGE_KEY);
  }

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('user');
  }


  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}