import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  instituteName = '';
  errorMessage = '';
  isLoading = false;
  activeField = '';
  private emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private fullNameRegex = /^[A-Za-z][A-Za-z .'-]{1,99}$/;
  private instituteRegex = /^[A-Za-z0-9][A-Za-z0-9 .,&()'-]{1,119}$/;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  get passwordTooShort(): boolean {
    return this.password.length > 0 && this.password.length < 6;
  }

  onSubmit(): void {
    const errors = this.validateForm();

    if (errors.length > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.api.register({
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword,
      instituteName: this.instituteName.trim()
    }).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Email or institute may already be in use.';
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

    if (!this.fullName.trim()) errors.push('Full name is required.');
    if (!this.email.trim()) errors.push('Email address is required.');
    if (!this.instituteName.trim()) errors.push('Institute name is required.');
    if (!this.password) errors.push('Password is required.');
    if (!this.confirmPassword) errors.push('Confirm password is required.');

    if (this.email.trim() && !this.emailRegex.test(this.email.trim())) {
      errors.push('Email address format is invalid.');
    }

    if (this.fullName.trim() && !this.fullNameRegex.test(this.fullName.trim())) {
      errors.push('Full name can contain letters, spaces, apostrophes, dots and hyphens only.');
    }

    if (this.instituteName.trim() && !this.instituteRegex.test(this.instituteName.trim())) {
      errors.push('Institute name contains invalid characters.');
    }

    if (this.password && this.password.length < 6) {
      errors.push('Password must be at least 6 characters.');
    }

    if (this.password && (!/[A-Za-z]/.test(this.password) || !/[0-9]/.test(this.password))) {
      errors.push('Password must include at least one letter and one number.');
    }

    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      errors.push('Passwords do not match.');
    }

    return errors;
  }

  get fullNameError(): string | null {
    if (!this.fullName.trim()) return 'Full name is required.';
    if (!this.fullNameRegex.test(this.fullName.trim())) {
      return 'Full name can contain letters, spaces, apostrophes, dots and hyphens only.';
    }
    return null;
  }

  get emailError(): string | null {
    if (!this.email.trim()) return 'Email address is required.';
    if (!this.emailRegex.test(this.email.trim())) return 'Email address format is invalid.';
    return null;
  }

  get instituteNameError(): string | null {
    if (!this.instituteName.trim()) return 'Institute name is required.';
    if (!this.instituteRegex.test(this.instituteName.trim())) return 'Institute name contains invalid characters.';
    return null;
  }

  get passwordError(): string | null {
    if (!this.password) return 'Password is required.';
    if (this.password.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Za-z]/.test(this.password) || !/[0-9]/.test(this.password)) {
      return 'Password must include at least one letter and one number.';
    }
    return null;
  }

  get confirmPasswordError(): string | null {
    if (!this.confirmPassword) return 'Confirm password is required.';
    if (this.password !== this.confirmPassword) return 'Passwords do not match.';
    return null;
  }

  get isFormValid(): boolean {
    return this.validateForm().length === 0;
  }
}
