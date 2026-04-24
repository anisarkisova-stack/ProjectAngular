import { Component, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CartService } from '../cart-service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class Signup {
  @Output() goToSignin = new EventEmitter();

  particles: string[] = Array.from({ length: 15 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 12 + Math.random() * 16;
    const size = 20 + Math.random() * 60;
    return `left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px`;
  });

  constructor(public service: CartService) {}

  public formInfo: FormGroup = new FormGroup({
    firstName: new FormControl(),
    lastName: new FormControl(),
    age: new FormControl(),
    email: new FormControl(),
    password: new FormControl(),
    address: new FormControl(),
    phone: new FormControl(),
    zipcode: new FormControl(),
    avatar: new FormControl(),
    gender: new FormControl(),
  });

  register() {
    this.service.signup(this.formInfo.value).subscribe((data: any) => {
      console.log(data);
    });
  }
}