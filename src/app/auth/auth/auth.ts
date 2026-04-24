import { Component } from '@angular/core';
import { Signin } from '../sign-in/sign-in';
import { Signup } from '../sign-up/sign-up';

@Component({
  selector: 'app-auth',
  imports: [Signin, Signup],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  currentView: 'signin' | 'signup' = 'signin';
}