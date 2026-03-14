import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DashboardStatsDto, ExamListDto } from '../../../core/models/models';
import { AuthStateService } from '../../../core/services/auth-state.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  stats: DashboardStatsDto = { totalExams: 0, totalStudents: 0, totalAttempts: 0, averageScore: 0 };
  exams: ExamListDto[] = [];
  isLoading = true;
  endingExamId: number | null = null;
  endExamError = '';
  endExamSuccess = '';
  private refreshHandle: number | null = null;
  statCardLinks = {
    exams: '/admin/dashboard',
    students: '/admin/manage-students',
    attempts: '/admin/results',
    average: '/admin/results'
  };

  constructor(private api: ApiService, public auth: AuthStateService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
    this.loadExams();
    this.refreshHandle = window.setInterval(() => {
      this.loadDashboardStats();
      this.loadExams();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle !== null) {
      window.clearInterval(this.refreshHandle);
    }
  }

  loadDashboardStats(): void {
    this.api.getDashboardStats().subscribe({
      next: (s) => (this.stats = s),
      error: () => {}
    });
  }

  loadExams(): void {
    this.api.getExams().subscribe({
      next: (e) => { this.exams = e; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  scrollToExamList(): void {
    const el = document.getElementById('all-exams');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  examStatus(exam: ExamListDto): 'live' | 'upcoming' | 'ended' | 'draft' {
    if (exam.status) {
      const mapped = exam.status.toLowerCase();
      if (mapped === 'live' || mapped === 'upcoming' || mapped === 'ended' || mapped === 'draft') {
        return mapped;
      }
    }

    if (!exam.startTime || !exam.endTime) return exam.isLive ? 'live' : 'draft';
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (now > end) return 'ended';
    if (now < start) return 'upcoming';
    return exam.isLive ? 'live' : 'ended';
  }

  publishActionLabel(exam: ExamListDto): string {
    return this.examStatus(exam) === 'ended' ? 'Re-publish' : 'Publish';
  }

  endExam(examId: number): void {
    if (this.endingExamId !== null) return;

    this.endingExamId = examId;
    this.endExamError = '';
    this.endExamSuccess = '';

    this.api.endExam(examId).subscribe({
      next: () => {
        this.endExamSuccess = 'Exam ended successfully.';
        this.endingExamId = null;
        this.loadExams();
      },
      error: (err) => {
        this.endExamError = err?.error?.message || 'Failed to end exam. Please try again.';
        this.endingExamId = null;
      }
    });
  }
}
