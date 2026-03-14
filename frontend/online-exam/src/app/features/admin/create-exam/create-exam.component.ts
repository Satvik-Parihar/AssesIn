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
  createdExamId: number | null = null;

  constructor(private api: ApiService, private router: Router) {}

  onSubmit(): void {
    if (this.durationMinutes === null || this.totalMarks === null) {
      this.errorMessage = 'Please enter duration and total marks.';
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
