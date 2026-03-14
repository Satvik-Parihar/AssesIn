import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ExamListDto } from '../../../core/models/models';

@Component({
  selector: 'app-generate-sets',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './generate-sets.component.html'
})
export class GenerateSetsComponent implements OnInit {
  exams: ExamListDto[] = [];
  selectedExamId: number | null = null;
  numberOfSets = 3;
  startTime = '';
  endTime = '';
  successMessage = '';
  errorMessage = '';
  isLoading = false;
  setNames = ['Set A', 'Set B', 'Set C', 'Set D', 'Set E'];
  activeField = '';
  private datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.api.getExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        const examId = this.route.snapshot.queryParamMap.get('examId');
        if (examId) this.selectedExamId = +examId;
      }
    });
    // Pre-fill with sensible defaults: starts now, ends in 2 hours
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    this.startTime = this.toLocalDatetimeString(now);
    this.endTime = this.toLocalDatetimeString(later);
  }

  toLocalDatetimeString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onSubmit(): void {
    const errors = this.validateForm();

    if (errors.length > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const examPaperId = this.selectedExamId!;

    this.api.generateSets({
      examPaperId,
      numberOfSets: this.numberOfSets,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(this.endTime).toISOString()
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to generate sets.';
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

    if (!this.selectedExamId) errors.push('Please select an exam.');
    if (!this.startTime) errors.push('Start date and time is required.');
    if (!this.endTime) errors.push('End date and time is required.');

    if (this.startTime && !this.datetimeLocalRegex.test(this.startTime)) {
      errors.push('Start date and time format is invalid.');
    }

    if (this.endTime && !this.datetimeLocalRegex.test(this.endTime)) {
      errors.push('End date and time format is invalid.');
    }

    if (!Number.isInteger(this.numberOfSets) || this.numberOfSets < 1 || this.numberOfSets > 5) {
      errors.push('Number of sets must be between 1 and 5.');
    }

    return errors;
  }

  get examError(): string | null {
    if (!this.selectedExamId) return 'Please select an exam.';
    return null;
  }

  get numberOfSetsError(): string | null {
    if (!Number.isInteger(this.numberOfSets) || this.numberOfSets < 1 || this.numberOfSets > 5) {
      return 'Number of sets must be between 1 and 5.';
    }
    return null;
  }

  get startTimeError(): string | null {
    if (!this.startTime) return 'Start date and time is required.';
    if (!this.datetimeLocalRegex.test(this.startTime)) return 'Start date and time format is invalid.';
    if (new Date(this.startTime) <= new Date()) return 'Start time must be in the future.';
    return null;
  }

  get endTimeError(): string | null {
    if (!this.endTime) return 'End date and time is required.';
    if (!this.datetimeLocalRegex.test(this.endTime)) return 'End date and time format is invalid.';
    if (new Date(this.endTime) <= new Date()) return 'End time must be in the future.';
    if (this.startTime && this.datetimeLocalRegex.test(this.startTime) && new Date(this.endTime) <= new Date(this.startTime)) {
      return 'End time must be after start time.';
    }
    return null;
  }

  get isFormValid(): boolean {
    return this.validateForm().length === 0;
  }
}
