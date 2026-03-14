import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { StudentListItem, CreateStudentRequest, UpdateStudentRequest } from '../../../core/models/models';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-manage-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-students.component.html'
})
export class ManageStudentsComponent implements OnInit {
  students: StudentListItem[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Add student form
  showAddForm = false;
  newStudent: CreateStudentRequest = { fullName: '', email: '', password: '', confirmPassword: '' };
  addError = '';
  addLoading = false;
  addActiveField = '';

  // Edit student
  editingId: number | null = null;
  editData: UpdateStudentRequest = { fullName: '', isActive: true };
  editError = '';
  editLoading = false;

  emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  fullNameRegex = /^[A-Za-z][A-Za-z .'-]{1,99}$/;

  constructor(private api: ApiService, public auth: AuthStateService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.api.getStudents().subscribe({
      next: (list) => { this.students = list; this.isLoading = false; },
      error: () => { this.errorMessage = 'Failed to load students.'; this.isLoading = false; }
    });
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    this.addError = '';
    this.addActiveField = '';
    this.newStudent = { fullName: '', email: '', password: '', confirmPassword: '' };
  }

  submitAddStudent(): void {
    const errors = this.validateAddStudent();
    if (errors.length > 0) {
      return;
    }

    const { fullName, email, password, confirmPassword } = this.newStudent;

    this.addLoading = true;
    this.addError = '';
    this.api.createStudent({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword
    }).subscribe({
      next: (created) => {
        this.students.unshift(created);
        this.successMessage = `Student "${created.fullName}" added successfully.`;
        this.showAddForm = false;
        this.addLoading = false;
        this.newStudent = { fullName: '', email: '', password: '', confirmPassword: '' };
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.addError = err.error?.message ?? 'Failed to create student.';
        this.addLoading = false;
      }
    });
  }

  onAddFieldChange(): void {
    this.addError = '';
  }

  setAddActiveField(field: string): void {
    this.addActiveField = field;
  }

  clearAddActiveField(field: string): void {
    if (this.addActiveField === field) this.addActiveField = '';
  }

  private validateAddStudent(): string[] {
    const { fullName, email, password, confirmPassword } = this.newStudent;
    const errors: string[] = [];

    if (!fullName.trim()) errors.push('Full name is required.');
    if (!email.trim()) errors.push('Email address is required.');
    if (!password) errors.push('Password is required.');
    if (!confirmPassword) errors.push('Confirm password is required.');

    if (email.trim() && !this.emailRegex.test(email.trim())) {
      errors.push('Email address format is invalid.');
    }

    if (fullName.trim() && !this.fullNameRegex.test(fullName.trim())) {
      errors.push('Full name can contain letters, spaces, apostrophes, dots and hyphens only.');
    }

    if (password && (password.length < 6 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))) {
      errors.push('Password must be at least 6 characters and include a letter and a number.');
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errors.push('Passwords do not match.');
    }

    return errors;
  }

  get addFullNameError(): string | null {
    const value = this.newStudent.fullName.trim();
    if (!value) return 'Full name is required.';
    if (!this.fullNameRegex.test(value)) {
      return 'Full name can contain letters, spaces, apostrophes, dots and hyphens only.';
    }
    return null;
  }

  get addEmailError(): string | null {
    const value = this.newStudent.email.trim();
    if (!value) return 'Email address is required.';
    if (!this.emailRegex.test(value)) return 'Email address format is invalid.';
    return null;
  }

  get addPasswordError(): string | null {
    const value = this.newStudent.password;
    if (!value) return 'Password is required.';
    if (value.length < 6 || !/[a-zA-Z]/.test(value) || !/[0-9]/.test(value)) {
      return 'Password must be at least 6 characters and include a letter and a number.';
    }
    return null;
  }

  get addConfirmPasswordError(): string | null {
    if (!this.newStudent.confirmPassword) return 'Confirm password is required.';
    if (this.newStudent.password !== this.newStudent.confirmPassword) return 'Passwords do not match.';
    return null;
  }

  get isAddFormValid(): boolean {
    return this.validateAddStudent().length === 0;
  }

  startEdit(student: StudentListItem): void {
    this.editingId = student.id;
    this.editData = { fullName: student.fullName, isActive: student.isActive };
    this.editError = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editError = '';
  }

  saveEdit(student: StudentListItem): void {
    this.editLoading = true;
    this.editError = '';
    this.api.updateStudent(student.id, {
      fullName: this.editData.fullName.trim(),
      isActive: this.editData.isActive
    }).subscribe({
      next: (updated) => {
        const idx = this.students.findIndex(s => s.id === updated.id);
        if (idx !== -1) this.students[idx] = updated;
        this.editingId = null;
        this.editLoading = false;
        this.successMessage = 'Student updated.';
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => {
        this.editError = err.error?.message ?? 'Failed to update student.';
        this.editLoading = false;
      }
    });
  }

  deactivate(student: StudentListItem): void {
    if (!confirm(`Deactivate "${student.fullName}"? They will no longer be able to log in.`)) return;
    this.api.deactivateStudent(student.id).subscribe({
      next: () => {
        const s = this.students.find(x => x.id === student.id);
        if (s) s.isActive = false;
        this.successMessage = `"${student.fullName}" has been deactivated.`;
        setTimeout(() => this.successMessage = '', 4000);
      },
      error: (err) => { this.errorMessage = err.error?.message ?? 'Failed to deactivate student.'; }
    });
  }
}
