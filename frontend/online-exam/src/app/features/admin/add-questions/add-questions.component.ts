import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ExamListDto, QuestionAdminDto } from '../../../core/models/models';

@Component({
  selector: 'app-add-questions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-questions.component.html'
})
export class AddQuestionsComponent implements OnInit {
  exams: ExamListDto[] = [];
  questions: QuestionAdminDto[] = [];
  selectedExamId: number | null = null;

  questionText = '';
  optionA = '';
  optionB = '';
  optionC = '';
  optionD = '';
  correctOption = 'A';
  marks = 1;

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isLoadingQuestions = false;
  activeField = '';
  private questionTextRegex = /^[A-Za-z0-9][A-Za-z0-9 .,;:!?()'"/\-]{4,499}$/;
  private optionTextRegex = /^[A-Za-z0-9][A-Za-z0-9 .,;:!?()'"/\-]{0,199}$/;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.api.getExams().subscribe({
      next: (exams) => {
        this.exams = exams;
        const examId = this.route.snapshot.queryParamMap.get('examId');
        if (examId) {
          this.selectedExamId = +examId;
          this.loadQuestions();
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load exams. Please refresh the page.';
      }
    });
  }

  onExamChange(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    if (!this.selectedExamId) return;
    this.isLoadingQuestions = true;
    this.api.getQuestions(this.selectedExamId).subscribe({
      next: (q) => { this.questions = q; this.isLoadingQuestions = false; },
      error: () => { this.isLoadingQuestions = false; }
    });
  }

  onSubmit(): void {
    const errors = this.validateForm();

    if (errors.length > 0) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const examPaperId = this.selectedExamId!;

    this.api.addQuestion({
      examPaperId,
      text: this.questionText.trim(),
      optionA: this.optionA.trim(),
      optionB: this.optionB.trim(),
      optionC: this.optionC.trim(),
      optionD: this.optionD.trim(),
      correctOption: this.correctOption,
      marks: this.marks
    }).subscribe({
      next: () => {
        this.successMessage = 'Question added successfully.';
        this.resetForm();
        this.loadQuestions();
        this.isLoading = false;
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to add question.';
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
    if (!this.questionText.trim()) errors.push('Question text is required.');
    if (!this.optionA.trim()) errors.push('Option A is required.');
    if (!this.optionB.trim()) errors.push('Option B is required.');
    if (!this.optionC.trim()) errors.push('Option C is required.');
    if (!this.optionD.trim()) errors.push('Option D is required.');

    if (this.questionText.trim() && this.questionText.trim().length < 5) {
      errors.push('Question text must be at least 5 characters.');
    }

    if (this.questionText.trim() && !this.questionTextRegex.test(this.questionText.trim())) {
      errors.push('Question text contains invalid characters.');
    }

    if (this.optionA.trim() && !this.optionTextRegex.test(this.optionA.trim())) {
      errors.push('Option A contains invalid characters.');
    }
    if (this.optionB.trim() && !this.optionTextRegex.test(this.optionB.trim())) {
      errors.push('Option B contains invalid characters.');
    }
    if (this.optionC.trim() && !this.optionTextRegex.test(this.optionC.trim())) {
      errors.push('Option C contains invalid characters.');
    }
    if (this.optionD.trim() && !this.optionTextRegex.test(this.optionD.trim())) {
      errors.push('Option D contains invalid characters.');
    }

    if (!['A', 'B', 'C', 'D'].includes(this.correctOption)) {
      errors.push('Correct option must be A, B, C, or D.');
    }

    if (!Number.isInteger(this.marks) || this.marks <= 0) {
      errors.push('Marks must be a positive whole number.');
    }

    const options = [this.optionA.trim(), this.optionB.trim(), this.optionC.trim(), this.optionD.trim()]
      .filter(v => v.length > 0)
      .map(v => v.toLowerCase());
    if (new Set(options).size !== options.length) {
      errors.push('Options must be different from each other.');
    }

    return errors;
  }

  get examError(): string | null {
    if (!this.selectedExamId) return 'Please select an exam.';
    return null;
  }

  get questionTextError(): string | null {
    if (!this.questionText.trim()) return 'Question text is required.';
    if (this.questionText.trim().length < 5) return 'Question text must be at least 5 characters.';
    if (!this.questionTextRegex.test(this.questionText.trim())) return 'Question text contains invalid characters.';
    return null;
  }

  get optionAError(): string | null {
    if (!this.optionA.trim()) return 'Option A is required.';
    if (!this.optionTextRegex.test(this.optionA.trim())) return 'Option A contains invalid characters.';
    return null;
  }

  get optionBError(): string | null {
    if (!this.optionB.trim()) return 'Option B is required.';
    if (!this.optionTextRegex.test(this.optionB.trim())) return 'Option B contains invalid characters.';
    return null;
  }

  get optionCError(): string | null {
    if (!this.optionC.trim()) return 'Option C is required.';
    if (!this.optionTextRegex.test(this.optionC.trim())) return 'Option C contains invalid characters.';
    return null;
  }

  get optionDError(): string | null {
    if (!this.optionD.trim()) return 'Option D is required.';
    if (!this.optionTextRegex.test(this.optionD.trim())) return 'Option D contains invalid characters.';
    return null;
  }

  get marksError(): string | null {
    if (!Number.isInteger(this.marks) || this.marks <= 0) return 'Marks must be a positive whole number.';
    return null;
  }

  get optionsDistinctError(): string | null {
    const options = [this.optionA.trim(), this.optionB.trim(), this.optionC.trim(), this.optionD.trim()]
      .filter(v => v.length > 0)
      .map(v => v.toLowerCase());
    if (options.length === 4 && new Set(options).size !== options.length) {
      return 'Options must be different from each other.';
    }
    return null;
  }

  get isFormValid(): boolean {
    return this.validateForm().length === 0;
  }

  get optionFieldsActive(): boolean {
    return ['optionA', 'optionB', 'optionC', 'optionD'].includes(this.activeField);
  }

  deleteQuestion(id: number): void {
    if (!confirm('Delete this question?')) return;
    this.api.deleteQuestion(id).subscribe({
      next: () => this.loadQuestions(),
      error: () => {}
    });
  }

  resetForm(): void {
    this.questionText = '';
    this.optionA = '';
    this.optionB = '';
    this.optionC = '';
    this.optionD = '';
    this.correctOption = 'A';
    this.marks = 1;
  }
}
