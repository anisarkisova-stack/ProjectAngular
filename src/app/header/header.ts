import { RouterLink } from '@angular/router';
import { CartService } from '../auth/cart-service';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeToggleComponent } from '../shared/theme-toggle/theme-toggle';

@Component({
  selector: 'app-header',
    standalone: true, 
  imports: [RouterLink, CommonModule,ThemeToggleComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  service = inject(CartService);
  userName: string | null = null;
  isLoggedIn: boolean = false;
  private sub!: Subscription;

  ngOnInit() {
    this.sub = this.service.authState$.subscribe(state => {
      this.isLoggedIn = state.isLoggedIn;
      this.userName = state.userName;
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

  logout() {
    this.service.signOut();
    this.service.updateAuthState(false, null);
  }
}