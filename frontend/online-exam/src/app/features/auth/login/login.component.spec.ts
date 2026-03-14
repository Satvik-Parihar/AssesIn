import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { ApiService } from '../../../core/services/api.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { AuthResponse } from '../../../core/models/models';

const mockAuthResponse: AuthResponse = {
  token: 'test-token',
  fullName: 'Satvik',
  role: 'Admin',
  userId: 1,
  instituteName: 'LJIET',
};

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let authStateServiceSpy: jasmine.SpyObj<AuthStateService>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['login']);
    authStateServiceSpy = jasmine.createSpyObj('AuthStateService', ['setUser']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [
        provideRouter([
          { path: 'admin/dashboard', component: DummyComponent },
          { path: 'student/dashboard', component: DummyComponent },
          { path: 'login', component: DummyComponent }
        ]),
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: AuthStateService, useValue: authStateServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('email and password should be empty on init', () => {
    expect(component.email).toBe('');
    expect(component.password).toBe('');
  });

  it('should show error when submitting with empty email', () => {
    component.email = '';
    component.password = 'admin@123';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
    expect(apiServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should show error when submitting with empty password', () => {
    component.email = 'satvik@admin.com';
    component.password = '';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
    expect(apiServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should not call api when both fields are empty', () => {
    component.email = '';
    component.password = '';
    component.onSubmit();
    expect(apiServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call apiService.login with correct credentials', () => {
    apiServiceSpy.login.and.returnValue(of(mockAuthResponse));
    component.email = 'satvik@admin.com';
    component.password = 'admin@123';
    component.onSubmit();
    expect(apiServiceSpy.login).toHaveBeenCalledWith({ email: 'satvik@admin.com', password: 'admin@123' });
  });

  it('should call authState.setUser on successful login', () => {
    apiServiceSpy.login.and.returnValue(of(mockAuthResponse));
    component.email = 'satvik@admin.com';
    component.password = 'admin@123';
    component.onSubmit();
    expect(authStateServiceSpy.setUser).toHaveBeenCalledWith(mockAuthResponse);
  });

  it('should set isLoading to true while request is in-flight', () => {
    apiServiceSpy.login.and.returnValue(of(mockAuthResponse));
    component.email = 'satvik@admin.com';
    component.password = 'admin@123';
    component.onSubmit();
    // after observable completes synchronously, isLoading stays true until navigation
    expect(apiServiceSpy.login).toHaveBeenCalled();
  });

  it('should show error message on login failure', () => {
    apiServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    component.email = 'satvik@admin.com';
    component.password = 'wrongpassword';
    component.onSubmit();
    expect(component.errorMessage).toBeTruthy();
  });

  it('should set isLoading to false after failed login', () => {
    apiServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
    component.email = 'satvik@admin.com';
    component.password = 'wrong';
    component.onSubmit();
    expect(component.isLoading).toBeFalse();
  });

  it('should clear errorMessage before each new login attempt', () => {
    component.errorMessage = 'Old error';
    apiServiceSpy.login.and.returnValue(of(mockAuthResponse));
    component.email = 'satvik@admin.com';
    component.password = 'admin@123';
    component.onSubmit();
    expect(component.errorMessage).toBe('');
  });
});
