// 
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface Station {
  id: number;
  name: string;
}

interface CalendarCell {
  label: string;
  date: Date | null;
  disabled: boolean;
  isToday: boolean;
  isSelected: boolean;
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  readonly MONTHS = [
    'იანვარი','თებერვალი','მარტი','აპრილი','მაისი','ივნისი',
    'ივლისი','აგვისტო','სექტემბერი','ოქტომბერი','ნოემბერი','დეკემბერი',
  ];

  stations: Station[] = [];
  selectedFrom: Station | null = null;
  selectedTo: Station | null = null;
  chosenDate: Date | null = null;
  passengers = 1;
  submitted = false;
  showAuthModal = false;

  openDropdown: 'from' | 'to' | 'date' | null = null;

  today = new Date();
  calDate = new Date();
  calendarCells: CalendarCell[] = [];

  constructor(private http: HttpClient, private router: Router) {
    this.today.setHours(0, 0, 0, 0);
  }

  ngOnInit(): void {
     this.generateParticles();
    this.http
      .get<Station[]>('https://railway.stepprojects.ge/api/stations')
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => (this.stations = data));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filteredFromStations(): Station[] {
    return this.stations.filter(s => s.id !== this.selectedTo?.id);
  }

  filteredToStations(): Station[] {
    return this.stations.filter(s => s.id !== this.selectedFrom?.id);
  }

  selectFrom(station: Station): void {
    this.selectedFrom = station;
    this.closeAll();
  }

  selectTo(station: Station): void {
    this.selectedTo = station;
    this.closeAll();
  }

  toggleDropdown(type: 'from' | 'to' | 'date'): void {
    if (this.openDropdown === type) { this.closeAll(); return; }
    this.openDropdown = type;
    if (type === 'date') this.buildCalendar();
  }

  closeAll(): void {
    this.openDropdown = null;
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('auth-modal-overlay')) {
      this.showAuthModal = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.closeAll();
    this.showAuthModal = false;
  }

  buildCalendar(): void {
    const y = this.calDate.getFullYear();
    const m = this.calDate.getMonth();
    const firstDay = new Date(y, m, 1);
    const totalDays = new Date(y, m + 1, 0).getDate();
    const offset = (firstDay.getDay() + 6) % 7;
    const cells: CalendarCell[] = [];

    for (let i = 0; i < offset; i++) {
      cells.push({ label: '', date: null, disabled: true, isToday: false, isSelected: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(y, m, d);
      cells.push({
        label: String(d),
        date,
        disabled: date < this.today,
        isToday: date.toDateString() === this.today.toDateString(),
        isSelected: !!this.chosenDate && date.toDateString() === this.chosenDate.toDateString(),
      });
    }
    this.calendarCells = cells;
  }

  prevMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.calDate = new Date(this.calDate.getFullYear(), this.calDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  pickDate(date: Date): void {
    this.chosenDate = date;
    this.calDate = new Date(date);
    this.buildCalendar();
    this.closeAll();
  }

  search(): void {
  this.submitted = true;

  if (!this.selectedFrom || !this.selectedTo || !this.chosenDate) {
    alert('ყველა ველი შესავსებია');
    return;
  }

  // auth guard
  // if (!sessionStorage.getItem('user')) {
  //   this.showAuthModal = true;
  //   return;
  // }

  const y = this.chosenDate.getFullYear();
  const m = String(this.chosenDate.getMonth() + 1).padStart(2, '0');
  const d = String(this.chosenDate.getDate()).padStart(2, '0');

  sessionStorage.setItem('trainSearch', JSON.stringify({
    fromId: this.selectedFrom.id,
    toId: this.selectedTo.id,
    fromName: this.selectedFrom.name,
    toName: this.selectedTo.name,
    date: `${y}-${m}-${d}`,
    passengers: this.passengers || 1,
  }));

  this.router.navigate(['/train-find']);
}
  particles: string[] = [];

private generateParticles(): void {
  this.particles = Array.from({ length: 15 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 12 + Math.random() * 16;
    const size = 20 + Math.random() * 60;
    return `left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px`;
  });
}
}
  
