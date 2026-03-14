import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  menuOpen = false;
  dropdownOpen = false;

  constructor(public auth: AuthStateService) {}

  get homeRoute(): string {
    if (!this.auth.isLoggedIn) return '/login';
    return this.auth.currentUser?.role === 'Admin' ? '/admin/dashboard' : '/student/dashboard';
  }

  get initials(): string {
    const name = this.auth.currentUser?.fullName ?? '';
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.dropdownOpen = false;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.dropdownOpen && !target.closest('.user-menu')) {
      this.dropdownOpen = false;
    }
  }

  logout(): void {
    this.menuOpen = false;
    this.dropdownOpen = false;
    this.auth.logout();
  }
}
