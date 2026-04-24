import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  public http = inject(HttpClient);
  public router = inject(Router);

  ticketCancelled$ = new BehaviorSubject<boolean>(false);
  authState$ = new BehaviorSubject<{ isLoggedIn: boolean; userName: string | null }>({
    isLoggedIn: !!sessionStorage.getItem('user'),
    userName: sessionStorage.getItem('userName'),
  });

  updateAuthState(isLoggedIn: boolean, userName: string | null) {
    this.authState$.next({ isLoggedIn, userName });
  }

  signup(info: any) {
    return this.http.post('https://api.everrest.educata.dev/auth/sign_up', info);
  }

  signin(info: any) {
    return this.http.post('https://api.everrest.educata.dev/auth/sign_in', info);
  }

  signOut() {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('userName');
    this.authState$.next({ isLoggedIn: false, userName: null });
    this.router.navigate(['auth']);
  }

  getUser() {
    const token = sessionStorage.getItem('user');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get('https://api.everrest.educata.dev/auth', { headers });
  }

  getProfile() {
    const token = sessionStorage.getItem('user');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get('https://api.everrest.educata.dev/auth', { headers });
  }

  updateProfile(data: any) {
    const token = sessionStorage.getItem('user');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.patch('https://api.everrest.educata.dev/auth/update', data, { headers });
  }

  recoverPassword(data: any) {
    const token = sessionStorage.getItem('user');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post('https://api.everrest.educata.dev/auth/recovery', data, { headers });
  }

  cancelAllTickets() {
    const token = sessionStorage.getItem('user');
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.delete('https://railway.stepprojects.ge/api/tickets/cancelAll', { headers });
  }
}