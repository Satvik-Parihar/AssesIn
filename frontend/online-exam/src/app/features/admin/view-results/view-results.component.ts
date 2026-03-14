import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { AdminResultDetailDto, AdminResultDto } from '../../../core/models/models';

@Component({
  selector: 'app-view-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-results.component.html'
})
export class ViewResultsComponent implements OnInit, OnDestroy {
  results: AdminResultDto[] = [];
  detailMap: Record<number, AdminResultDetailDto> = {};
  expandedAttemptId: number | null = null;
  detailLoading = false;
  detailError = '';
  isLoading = true;
  private refreshHandle: number | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadResults(true);
    this.refreshHandle = window.setInterval(() => this.loadResults(false), 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle !== null) {
      window.clearInterval(this.refreshHandle);
    }
  }

  loadResults(showLoader: boolean): void {
    if (showLoader) {
      this.isLoading = true;
    }

    this.api.getAdminResults().subscribe({
      next: (r) => {
        this.results = r;
        this.isLoading = false;

        if (this.expandedAttemptId && this.results.some(x => x.attemptId === this.expandedAttemptId)) {
          this.api.getAdminResultDetail(this.expandedAttemptId).subscribe({
            next: (detail) => {
              this.detailMap[this.expandedAttemptId!] = detail;
            },
            error: () => {}
          });
        }
      },
      error: () => { this.isLoading = false; }
    });
  }

  getPercentage(score: number, total: number): number {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  toggleDetails(attemptId: number): void {
    if (this.expandedAttemptId === attemptId) {
      this.expandedAttemptId = null;
      this.detailError = '';
      return;
    }

    this.expandedAttemptId = attemptId;
    this.detailError = '';

    if (this.detailMap[attemptId]) {
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
}
