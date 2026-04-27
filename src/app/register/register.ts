import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';

import { RegisterService, BookingState } from './register.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  cardNumber  = '';
  expiry      = '';
  cvv         = '';
  cardHolder  = '';

  totalAmount = 'იტვირთება...';
  errorMsg    = '';
  loading     = false;

  private bookingState: BookingState = {};

  constructor(private registerService: RegisterService) {}

  ngOnInit(): void {
    this.bookingState = this.registerService.loadBookingState();

    this.registerService.resolveAmount(
      this.bookingState,
      this.destroy$,
      amount => (this.totalAmount = amount),
      ()     => (this.totalAmount = '–.–₾'),
    );
  }


  formatCardNumber(): void {
    const val = this.cardNumber.replace(/\D/g, '').substring(0, 16);
    this.cardNumber = val.replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry(): void {
    const val = this.expiry.replace(/\D/g, '').substring(0, 6);
    this.expiry = val.length > 2 ? val.substring(0, 2) + '/' + val.substring(2) : val;
  }


  handlePayment(): void {
    this.errorMsg = '';

    if (this.cardNumber.replace(/\s/g, '').length < 16)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ სწორი ბარათის ნომერი (16 ციფრი)');
    if (this.expiry.length < 5)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ ბარათის ვადა (MM/YY)');
    if (this.cvv.length < 3)
      return void (this.errorMsg = 'გთხოვთ შეიყვანოთ CVC/CVV კოდი');

    this.loading = true;
    const savedCard = this.cardNumber;

    this.registerService.registerTicket(
      this.bookingState,
      this.destroy$,
      ticketId => this.registerService.checkStatus(
        ticketId,
        this.destroy$,
        () => this.registerService.confirmTicket(
          ticketId,
          savedCard,
          this.destroy$,
          () => (this.loading = false),
        ),
        msg => { this.loading = false; this.errorMsg = msg; },
      ),
      msg => { this.loading = false; this.errorMsg = msg; },
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}