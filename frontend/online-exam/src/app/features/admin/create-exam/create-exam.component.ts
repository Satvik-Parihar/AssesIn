import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-create-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-exam.component.html'
})
export class CreateExamComponent {
  title = '';
  subject = '';
  durationMinutes: number | null = null;
  totalMarks: number | null = null;
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  activeField = '';
  createdExamId: number | null = null;
  private titleRegex = /^[A-Za-z0-9][A-Za-z0-9 .,&():'"?!+-]{2,149}$/;
  private subjectRegex = /^[A-Za-z][A-Za-z0-9 &()'.-]{1,79}$/;

  constructor(private api: ApiService, private router: Router) {}

  onSubmit(): void {
    const errors = this.validateForm();

    if (errors.length > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const durationMinutes = this.durationMinutes!;
    const totalMarks = this.totalMarks!;

    this.api.createExam({
      title: this.title.trim(),
      subject: this.subject.trim(),
      durationMinutes,
      totalMarks
    }).subscribe({
      next: (res) => {
        this.createdExamId = res.examId;
        this.successMessage = `Exam "${this.title}" created successfully!`;
        this.isLoading = false;
        this.resetForm();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to create exam.';
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

    if (!this.title.trim()) errors.push('Exam title is required.');
    if (!this.subject.trim()) errors.push('Subject is required.');
    if (this.durationMinutes === null) errors.push('Duration is required.');
    if (this.totalMarks === null) errors.push('Total marks is required.');

    if (this.title.trim() && this.title.trim().length < 3) {
      errors.push('Exam title must be at least 3 characters.');
    }

    if (this.title.trim() && !this.titleRegex.test(this.title.trim())) {
      errors.push('Exam title contains invalid characters.');
    }

    if (this.subject.trim() && this.subject.trim().length < 2) {
      errors.push('Subject must be at least 2 characters.');
    }

    if (this.subject.trim() && !this.subjectRegex.test(this.subject.trim())) {
      errors.push('Subject contains invalid characters.');
    }

    if (this.durationMinutes !== null && (!Number.isInteger(this.durationMinutes) || this.durationMinutes <= 0)) {
      errors.push('Duration must be a positive whole number.');
    }

    if (this.totalMarks !== null && (!Number.isInteger(this.totalMarks) || this.totalMarks <= 0)) {
      errors.push('Total marks must be a positive whole number.');
    }

    return errors;
  }

  get titleError(): string | null {
    if (!this.title.trim()) return 'Exam title is required.';
    if (this.title.trim().length < 3) return 'Exam title must be at least 3 characters.';
    if (!this.titleRegex.test(this.title.trim())) return 'Exam title contains invalid characters.';
    return null;
  }

  get subjectError(): string | null {
    if (!this.subject.trim()) return 'Subject is required.';
    if (this.subject.trim().length < 2) return 'Subject must be at least 2 characters.';
    if (!this.subjectRegex.test(this.subject.trim())) return 'Subject contains invalid characters.';
    return null;
  }

  get durationError(): string | null {
    if (this.durationMinutes === null) return 'Duration is required.';
    if (!Number.isInteger(this.durationMinutes) || this.durationMinutes <= 0) {
      return 'Duration must be a positive whole number.';
    }
    return null;
  }

  get totalMarksError(): string | null {
    if (this.totalMarks === null) return 'Total marks is required.';
    if (!Number.isInteger(this.totalMarks) || this.totalMarks <= 0) {
      return 'Total marks must be a positive whole number.';
    }
    return null;
  }

  get isFormValid(): boolean {
    return this.validateForm().length === 0;
  }

  goToAddQuestions(): void {
    if (this.createdExamId) {
      this.router.navigate(['/admin/add-questions'], { queryParams: { examId: this.createdExamId } });
    }
  }

  resetForm(): void {
    this.title = '';
    this.subject = '';
    this.durationMinutes = null;
    this.totalMarks = null;
  }
}
