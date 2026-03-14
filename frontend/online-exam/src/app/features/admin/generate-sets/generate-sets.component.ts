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

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.api.getExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        const examId = this.route.snapshot.queryParamMap.get('examId');
        if (examId) this.selectedExamId = +examId;
      }
    });
    // Pre-fill with sensible defaults: starts in 1 minute, ends in 2 hours after start
    const start = new Date(Date.now() + 60 * 1000);
    const later = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    this.startTime = this.toLocalDatetimeString(start);
    this.endTime = this.toLocalDatetimeString(later);
  }

  toLocalDatetimeString(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  onSubmit(): void {
    if (!this.selectedExamId) {
      this.errorMessage = 'Please select an exam first.';
      return;
    }

    if (!this.startTime || !this.endTime) {
      this.errorMessage = 'Please set both start and end time.';
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
}
