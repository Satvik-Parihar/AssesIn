import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ResultDto } from '../../../core/models/models';

@Component({
  selector: 'app-student-results',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './results.component.html'
})
export class StudentResultsComponent implements OnInit {
  latestResult: ResultDto | null = null;
  allResults: ResultDto[] = [];
  isLoading = false;
  showHistory = false;

  constructor(private api: ApiService, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.latestResult = nav?.extras?.state?.['result'] ?? null;
  }

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading = true;
    this.api.getStudentResults().subscribe({
      next: (r) => { this.allResults = r; this.isLoading = false; },
      error: () => { this.isLoading = false; }
    });
  }

  get percentage(): number {
    if (!this.latestResult) return 0;
    return this.latestResult.totalMarks > 0
      ? Math.round((this.latestResult.score / this.latestResult.totalMarks) * 100)
      : 0;
  }

  getPercentage(score: number, total: number): number {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  get grade(): string { return this.calcGrade(this.percentage); }

  calcGrade(pct: number): string {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }

  get isPassed(): boolean { return this.percentage >= 50; }
}
