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
    if (!this.selectedExamId) {
      this.errorMessage = 'Please select an exam first.';
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
