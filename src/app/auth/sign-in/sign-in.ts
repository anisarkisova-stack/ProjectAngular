import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../cart-service';

@Component({
  selector: 'app-signin',
  imports: [ReactiveFormsModule],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.scss',
})
export class Signin {
  @Output() goToSignup = new EventEmitter();

  router = inject(Router);

  particles: string[] = Array.from({ length: 15 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 12 + Math.random() * 16;
    const size = 20 + Math.random() * 60;
    return `left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px`;
  });

  constructor(public service: CartService) {}

  public loginFormInfo: FormGroup = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  login() {
    this.service.signin(this.loginFormInfo.value).subscribe((data: any) => {
      const token = data.access_token || data.token || data.accessToken;
      if (token) {
        sessionStorage.setItem("user", token);
        this.service.getUser().subscribe((user: any) => {
          const userName = `${user.firstName} ${user.lastName}`;
          sessionStorage.setItem('userName', userName);
          this.service.updateAuthState(true, userName);
          this.router.navigate(["profile"]);
        });
      }
    });
  }
}