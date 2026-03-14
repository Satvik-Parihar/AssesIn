import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AdminExamAttemptDto, AdminExamDetailDto, AdminResultDetailDto } from '../../../core/models/models';

@Component({
  selector: 'app-admin-exam-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './exam-detail.component.html'
})
export class AdminExamDetailComponent implements OnInit, OnDestroy {
  examDetail: AdminExamDetailDto | null = null;
  detailMap: Record<number, AdminResultDetailDto> = {};
  expandedAttemptId: number | null = null;
  detailLoading = false;
  detailError = '';
  isLoading = true;
  errorMessage = '';
  private refreshHandle: number | null = null;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadExamDetail(true);
    this.refreshHandle = window.setInterval(() => this.loadExamDetail(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle !== null) {
      window.clearInterval(this.refreshHandle);
    }
  }

  loadExamDetail(showLoader: boolean): void {
    const examId = Number(this.route.snapshot.paramMap.get('id'));
    if (!examId) {
      this.errorMessage = 'Invalid exam selected.';
      this.isLoading = false;
      return;
    }

    if (showLoader) {
      this.isLoading = true;
    }

    this.api.getAdminExamDetail(examId).subscribe({
      next: (detail) => {
        this.examDetail = detail;
        this.isLoading = false;
        this.errorMessage = '';

        if (this.expandedAttemptId && !detail.attempts.some(a => a.attemptId === this.expandedAttemptId)) {
          this.expandedAttemptId = null;
          this.detailError = '';
        }

        if (this.expandedAttemptId) {
          this.loadAttemptDetail(this.expandedAttemptId, false);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to load exam details.';
        this.isLoading = false;
      }
    });
  }

  toggleDetails(attemptId: number): void {
    if (this.expandedAttemptId === attemptId) {
      this.expandedAttemptId = null;
      this.detailError = '';
      return;
    }

    this.expandedAttemptId = attemptId;
    this.loadAttemptDetail(attemptId, true);
  }

  loadAttemptDetail(attemptId: number, showLoader: boolean): void {
    this.detailError = '';

    if (!showLoader && this.detailMap[attemptId]) {
      return;
    }

    this.detailLoading = true;
    this.api.getAdminResultDetail(attemptId).subscribe({
      next: (detail) => {
        this.detailMap[attemptId] = detail;
        this.detailLoading = false;
      },
      error: (err) => {
        this.detailError = err.error?.message ?? 'Failed to load full result.';
        this.detailLoading = false;
      }
    });
  }

  getOptionLabel(option: string | null): string {
    return option && option.trim() ? option : 'Not answered';
  }

  getGrade(pct: number): string {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }

  getGradeClass(pct: number): string {
    if (pct >= 70) return 'grade-pass';
    if (pct >= 50) return 'grade-average';
    return 'grade-fail';
  }

  getAttemptStatus(attempt: AdminExamAttemptDto): 'live' | 'ended' | 'upcoming' {
    if (attempt.isCompleted) return 'ended';
    return 'live';
  }
}