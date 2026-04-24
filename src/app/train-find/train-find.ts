import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';
import { ChangeDetectorRef } from '@angular/core';

interface Train {
  id: number;
  number: string;
  name: string;
  from: string;
  to: string;
  departure: string;
  arrive: string;
  date: string;
}

interface SearchParams {
  fromId: number;
  toId: number;
  fromName: string;
  toName: string;
  date: string;
  passengers: number;
}

const GEO_DAYS = ['კვირა','ორშაბათი','სამშაბათი','ოთხშაბათი','ხუთშაბათი','პარასკევი','შაბათი'];

@Component({
  selector: 'app-train-find',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './train-find.html',
  styleUrl: './train-find.scss',
})
export class TrainFind implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();


  params: SearchParams = JSON.parse(sessionStorage.getItem('trainSearch') || '{}');
  trains: Train[] = [];
  loading = true;

  get formattedDate(): string {
    if (!this.params.date) return '—';
    const [y, m, d] = this.params.date.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('ka-GE', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  }

constructor(private http: HttpClient, private router: Router, private cdr: ChangeDetectorRef) {}
  ngOnInit(): void {
    let chosenDay: string | null = null;

    if (this.params.date) {
      const [y, m, d] = this.params.date.split('-').map(Number);
      chosenDay = GEO_DAYS[new Date(y, m - 1, d).getDay()];
    }
    
    this.http
      .get<Train[]>('https://railway.stepprojects.ge/api/trains')
      .pipe(
        takeUntil(this.destroy$),
        
        map(data => data.filter(t =>
          (!this.params.fromName || t.from === this.params.fromName) &&
          (!this.params.toName   || t.to   === this.params.toName)   &&
          (!chosenDay            || t.date  === chosenDay)
          
        ))
      )
      .subscribe({
     next: trains => {
  this.trains = trains;
  this.loading = false;
  this.cdr.detectChanges();
},
error: () => {
  this.loading = false;
  this.cdr.detectChanges(); 
},
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  book(train: Train): void {
    sessionStorage.setItem('bookingState', JSON.stringify({
      route: {
        trainId:        '#' + train.number,
        trainName:      train.name,
        from:           train.from,
        to:             train.to,
        depTime:        train.departure,
        arrTime:        train.arrive,
        date:           this.params.date        || '',
        passengerCount: Number(this.params.passengers) || 1,
        apiId:          train.id,
        wagonDay:       train.date              || '',
      },
      contact:    { email: '', phone: '' },
      passengers: [],
    }));

    this.router.navigate(['/booking']);
  }
}