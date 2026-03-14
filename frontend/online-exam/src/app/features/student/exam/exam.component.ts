import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { QuestionDto, StartExamResponse, SubmitAnswerDto } from '../../../core/models/models';

@Component({
  selector: 'app-exam',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam.component.html'
})
export class ExamComponent implements OnInit, OnDestroy {
  examData: StartExamResponse | null = null;
  currentIndex = 0;
  answers: Map<number, string | null> = new Map();
  timeRemaining = 0;
  allowedUntilMs = 0;
  timerInterval: any = null;
  isSubmitting = false;
  errorMessage = '';

  constructor(private api: ApiService, private router: Router) {
    const nav = this.router.getCurrentNavigation();
    this.examData = nav?.extras?.state?.['examData'] ?? null;
  }

  ngOnInit(): void {
    if (!this.examData) {
      this.router.navigate(['/student/dashboard']);
      return;
    }
    this.allowedUntilMs = new Date(this.examData.allowedUntilUtc).getTime();
    this.timeRemaining = this.computeRemainingSeconds();
    this.examData.questions.forEach(q => this.answers.set(q.id, null));
    if (this.timeRemaining === 0) {
      this.autoSubmit();
      return;
    }
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  get currentQuestion(): QuestionDto | null {
    return this.examData?.questions[this.currentIndex] ?? null;
  }

  get totalQuestions(): number {
    return this.examData?.questions.length ?? 0;
  }

  get answeredCount(): number {
    return Array.from(this.answers.values()).filter(v => v !== null).length;
  }

  get formattedTime(): string {
    const m = Math.floor(this.timeRemaining / 60).toString().padStart(2, '0');
    const s = (this.timeRemaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get timerClass(): string {
    if (this.timeRemaining <= 60) return 'timer-danger';
    if (this.timeRemaining <= 300) return 'timer-warning';
    return 'timer-normal';
  }

  get allowedUntilLocal(): string {
    if (!this.examData) return '';
    return new Date(this.examData.allowedUntilUtc).toLocaleString();
  }

  get canInteract(): boolean {
    return !this.isSubmitting && this.timeRemaining > 0;
  }

  getAnswerForQuestion(qId: number): string | null {
    return this.answers.get(qId) ?? null;
  }

  isAnswered(qId: number): boolean {
    return !!this.answers.get(qId);
  }

  selectOption(option: string): void {
    if (!this.canInteract) return;
    if (!this.currentQuestion) return;
    this.answers.set(this.currentQuestion.id, option);
  }

  goTo(index: number): void {
    if (!this.canInteract) return;
    if (index >= 0 && index < this.totalQuestions) {
      this.currentIndex = index;
    }
  }

  next(): void { this.goTo(this.currentIndex + 1); }
  prev(): void { this.goTo(this.currentIndex - 1); }

  submitExam(): void {
    if (!this.canInteract) return;

    const unanswered = this.totalQuestions - this.answeredCount;
    if (unanswered > 0) {
      const confirmed = confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
      if (!confirmed) return;
    }

    this.isSubmitting = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    const submitAnswers: SubmitAnswerDto[] = this.examData!.questions.map(q => ({
      questionId: q.id,
      selectedOption: this.answers.get(q.id) ?? null
    }));

    this.api.submitExam({ attemptId: this.examData!.attemptId, answers: submitAnswers }).subscribe({
      next: (result) => {
        this.router.navigate(['/student/results'], { state: { result } });
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to submit exam.';
        this.isSubmitting = false;
      }
    });
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.timeRemaining = this.computeRemainingSeconds();
      if (this.timeRemaining <= 0) {
        clearInterval(this.timerInterval);
        this.autoSubmit();
      }
    }, 1000);
  }

  private computeRemainingSeconds(): number {
    return Math.max(0, Math.floor((this.allowedUntilMs - Date.now()) / 1000));
  }

  private autoSubmit(): void {
    alert('Time is up! Your exam is being submitted automatically.');
    this.isSubmitting = true;
    const submitAnswers: SubmitAnswerDto[] = this.examData!.questions.map(q => ({
      questionId: q.id,
      selectedOption: this.answers.get(q.id) ?? null
    }));
    this.api.submitExam({ attemptId: this.examData!.attemptId, answers: submitAnswers }).subscribe({
      next: (result) => this.router.navigate(['/student/results'], { state: { result } }),
      error: (err) => {
        const message = err?.error?.message || 'Your exam session expired and has been closed. Please check your results or dashboard.';
        this.router.navigate(['/student/dashboard'], { state: { flashMessage: message } });
      }
    });
  }
}
