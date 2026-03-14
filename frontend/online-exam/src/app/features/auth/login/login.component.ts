import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  activeField = '';
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private api: ApiService,
    private authState: AuthStateService,
    private router: Router
  ) {}

  onSubmit(): void {
    const errors = this.validateForm();

    if (errors.length > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.api.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: (res) => {
        this.authState.setUser(res);
        if (res.role === 'Admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: () => {
        this.errorMessage = 'Invalid email or password.';
        this.isLoading = false;
      }
    });
  }

  onFieldChange(): void {
    this.errorMessage = '';
  }

  setActiveField(field: string): void {
    this.activeField = field;
  }

  clearActiveField(field: string): void {
    if (this.activeField === field) this.activeField = '';
  }

  private validateForm(): string[] {
    const errors: string[] = [];

    if (!this.email.trim()) {
      errors.push('Email address is required.');
    } else if (!this.emailRegex.test(this.email.trim())) {
      errors.push('Email address format is invalid.');
    }

    if (!this.password) {
      errors.push('Password is required.');
    }

    return errors;
  }

  get emailError(): string | null {
    if (!this.email.trim()) return 'Email address is required.';
    if (!this.emailRegex.test(this.email.trim())) return 'Email address format is invalid.';
    return null;
  }

  get passwordError(): string | null {
    if (!this.password) return 'Password is required.';
    return null;
  }

  get isFormValid(): boolean {
    return this.validateForm().length === 0;
  }
}
