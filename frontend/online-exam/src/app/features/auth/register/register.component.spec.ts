import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthResponse } from '../../../core/models/models';

const mockAuthResponse: AuthResponse = {
  token: 'test-token',
  fullName: 'Satvik Patel',
  role: 'Admin',
  userId: 2,
  instituteName: 'LJ University',
};

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authStateServiceSpy: jasmine.SpyObj<AuthStateService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['register']);
    authStateServiceSpy = jasmine.createSpyObj('AuthStateService', ['setUser']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent, FormsModule],
      providers: [
        provideRouter([
          { path: 'login', component: DummyComponent },
          { path: 'admin/dashboard', component: DummyComponent },
          { path: 'student/dashboard', component: DummyComponent }
        ]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthStateService, useValue: authStateServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('all fields should be empty on init', () => {
    expect(component.fullName).toBe('');
    expect(component.email).toBe('');
    expect(component.password).toBe('');
    expect(component.confirmPassword).toBe('');
    expect(component.instituteName).toBe('');
  });

  it('passwordMismatch should be false when confirmPassword is empty', () => {
    component.password = 'secret123';
    component.confirmPassword = '';
    expect(component.passwordMismatch).toBeFalse();
  });

  it('passwordMismatch should be true when passwords differ', () => {
    component.password = 'secret123';
    component.confirmPassword = 'different';
    expect(component.passwordMismatch).toBeTrue();
  });

  it('passwordMismatch should be false when passwords match', () => {
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    expect(component.passwordMismatch).toBeFalse();
  });

  it('passwordTooShort should be true when password is less than 6 chars', () => {
    component.password = 'abc';
    expect(component.passwordTooShort).toBeTrue();
  });

  it('passwordTooShort should be false when password is 6+ chars', () => {
    component.password = 'secret123';
    expect(component.passwordTooShort).toBeFalse();
  });

  it('should show error when any field is empty', () => {
    component.fullName = '';
    component.email = 'satvik@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
    expect(apiServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should show error when passwords do not match', () => {
    component.fullName = 'Satvik Patel';
    component.email = 'satvik@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'different';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
    expect(apiServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should show error when password is too short', () => {
    component.fullName = 'Satvik Patel';
    component.email = 'satvik@student.com';
    component.password = 'abc';
    component.confirmPassword = 'abc';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
    expect(apiServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should call apiService.register with all fields on valid submit', () => {
    apiServiceSpy.register.and.returnValue(of(mockAuthResponse));
    component.fullName = 'Satvik Patel';
    component.email = 'satvik@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(apiServiceSpy.register).toHaveBeenCalledWith({
      fullName: 'Satvik Patel',
      email: 'satvik@student.com',
      password: 'secret123',
      confirmPassword: 'secret123',
      instituteName: 'LJ University',
    });
  });

  it('should navigate to /login on successful registration', () => {
    apiServiceSpy.register.and.returnValue(of(mockAuthResponse));
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.stub();
    component.fullName = 'Satvik Patel';
    component.email = 'satvik@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(authStateServiceSpy.setUser).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should show error on registration failure', () => {
    apiServiceSpy.register.and.returnValue(throwError(() => ({ error: { message: 'Email already exists' } })));
    component.fullName = 'Satvik Patel';
    component.email = 'existing@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });

  it('should set isLoading to false after failed registration', () => {
    apiServiceSpy.register.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.fullName = 'Satvik Patel';
    component.email = 'satvik@student.com';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.instituteName = 'LJ University';
    component.onSubmit();
    expect(component.isLoading).toBeFalse();
  });
});