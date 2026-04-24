import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { CartService } from '../cart-service';

interface PassengerRow {
  name: string; surname: string; idNumber: string;
  seatNum: string; vagonName: string; price: number;
}
interface Ticket {
  ticketId: string; from: string; to: string;
  date: string; depTime: string; total: number;
  passengers: PassengerRow[];
}

@Component({
  selector: 'app-profile',
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  activeTab = 'info';
  user: any = null;
  tickets: Ticket[] = [];
  successMsg = '';
  errorMsg = '';
  editingField: string | null = null;

  profileForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    age: new FormControl(''),
    phone: new FormControl(''),
    email: new FormControl(''),
    address: new FormControl(''),
    zipcode: new FormControl(''),
    gender: new FormControl(''),
  });

  passwordForm = new FormGroup({
    oldPassword: new FormControl(''),
    newPassword: new FormControl(''),
    confirmPassword: new FormControl(''),
  });

  constructor(public service: CartService) {}

  ngOnInit() {
    this.service.getProfile().subscribe({
      next: (data: any) => {
        this.user = data;
        this.profileForm.patchValue(data);
      },
      error: () => { this.errorMsg = 'პროფილის ჩატვირთვა ვერ მოხერხდა'; }
    });

    this.loadTickets();

    this.service.ticketCancelled$.subscribe(cancelled => {
      if (cancelled) {
        this.tickets = [];
      }
    });
  }

  editField(field: string) {
    this.editingField = field;
  }

  saveField(field: string) {
    const value = { [field]: this.profileForm.get(field)?.value };
    this.service.updateProfile(value).subscribe({
      next: () => {
        this.editingField = null;
        this.showSuccess('შენახულია!');
        if (this.user) this.user[field] = value[field];
        if (field === 'firstName' || field === 'lastName') {
          const name = `${this.profileForm.get('firstName')?.value} ${this.profileForm.get('lastName')?.value}`;
          sessionStorage.setItem('userName', name);
          this.service.updateAuthState(true, name);
        }
      },
      error: () => { this.showError('შენახვა ვერ მოხერხდა'); }
    });
  }

  cancelEdit() {
    this.editingField = null;
    this.profileForm.patchValue(this.user);
  }

  changePassword() {
    const { oldPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (!oldPassword || !newPassword || !confirmPassword) {
      this.showError('შეავსეთ ყველა ველი');
      return;
    }
    if (newPassword !== confirmPassword) {
      this.showError('პაროლები არ ემთხვევა');
      return;
    }
    this.service.recoverPassword({ oldPassword, newPassword }).subscribe({
      next: () => {
        this.showSuccess('პაროლი წარმატებით შეიცვალა!');
        this.passwordForm.reset();
      },
      error: () => { this.showError('პაროლის შეცვლა ვერ მოხერხდა'); }
    });
  }

  deleteTicket(index: number) {
    this.service.cancelAllTickets().subscribe({
      next: () => {
        this.tickets = [];
        sessionStorage.removeItem('invoiceData');
        sessionStorage.removeItem('bookingState');
        sessionStorage.removeItem('lastTicketId');
        this.service.ticketCancelled$.next(true);
        this.showSuccess('ბილეთი წარმატებით გაუქმდა!');
      },
      error: () => { this.showError('ბილეთის გაუქმება ვერ მოხერხდა'); }
    });
  }

  logout() {
    this.service.signOut();
  }

  onAvatarChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (this.user) this.user.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  private loadTickets() {
    try {
      const inv = sessionStorage.getItem('invoiceData');
      if (inv) {
        const d = JSON.parse(inv);
        this.tickets = [{
          ticketId: d.ticketId || '—',
          from: d.train?.from || '—',
          to: d.train?.to || '—',
          date: d.date || '—',
          depTime: d.train?.departure || '',
          total: d.ticketPrice || 0,
          passengers: (d.persons || []).map((p: any) => ({
            name: p.name, surname: p.surname, idNumber: p.idNumber,
            seatNum: p.seatNum, vagonName: 'ვაგონი ' + p.vagonId, price: p.price,
          }))
        }];
        return;
      }
      const raw = sessionStorage.getItem('bookingState');
      if (raw) {
        const s = JSON.parse(raw);
        this.tickets = [{
          ticketId: sessionStorage.getItem('lastTicketId') || '—',
          from: s.route?.from || '—', to: s.route?.to || '—',
          date: s.route?.date || '—', depTime: s.route?.depTime || '',
          total: s.invoice?.total || 0, passengers: s.passengers || []
        }];
      }
    } catch (_) {}
  }

  private showSuccess(msg: string) {
    this.successMsg = msg;
    this.errorMsg = '';
    setTimeout(() => this.successMsg = '', 3000);
  }

  private showError(msg: string) {
    this.errorMsg = msg;
    this.successMsg = '';
    setTimeout(() => this.errorMsg = '', 3000);
  }
}