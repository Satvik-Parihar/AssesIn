import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ExamListDto } from '../../../core/models/models';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class StudentDashboardComponent implements OnInit {
  exams: ExamListDto[] = [];
  isLoading = true;
  startingExamId: number | null = null;
  errorMessage = '';
  flashMessage = '';

  constructor(
    private api: ApiService,
    private router: Router,
    public auth: AuthStateService
  ) {}

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    this.flashMessage =
      nav?.extras?.state?.['flashMessage'] ??
      (history.state?.flashMessage || '');

    this.api.getExams().subscribe({
      next: (e) => { this.exams = e; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  examStatus(exam: ExamListDto): 'live' | 'upcoming' | 'ended' {
    if (exam.status) {
      if (exam.status === 'Live') return 'live';
      if (exam.status === 'Ended') return 'ended';
      return 'upcoming';
    }

    if (!exam.isLive || !exam.startTime || !exam.endTime) return 'upcoming';
    const now = new Date();
    if (now < new Date(exam.startTime)) return 'upcoming';
    if (now > new Date(exam.endTime)) return 'ended';
    return 'live';
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  }

  startExam(examId: number): void {
    this.startingExamId = examId;
    this.errorMessage = '';
    this.api.startExam({ examPaperId: examId }).subscribe({
      next: (res) => {
        this.startingExamId = null;
        this.router.navigate(['/student/exam'], { state: { examData: res } });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to start exam.';
        this.startingExamId = null;
      }
    });
  }
}
