import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ExamComponent } from './exam.component';
import { ApiService } from '../../../core/services/api.service';
import { StartExamResponse, ResultDto } from '../../../core/models/models';

const now = new Date();
const allowedUntil = new Date(now.getTime() + 30 * 60 * 1000);

const mockExamData: StartExamResponse = {
  attemptId: 1,
  examPaperId: 10,
  examTitle: 'Sample Exam',
  subject: 'Math',
  durationMinutes: 30,
  totalMarks: 10,
  startedAt: now.toISOString(),
  allowedUntilUtc: allowedUntil.toISOString(),
  questions: [
    { id: 101, text: 'What is 2 + 2?', optionA: '3', optionB: '4', optionC: '5', optionD: '6', marks: 2 },
    { id: 102, text: 'What is 3 * 3?', optionA: '6', optionB: '7', optionC: '8', optionD: '9', marks: 2 },
    { id: 103, text: 'What is 10 / 2?', optionA: '4', optionB: '5', optionC: '6', optionD: '7', marks: 2 },
  ],
};

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('ExamComponent', () => {
  let fixture: ComponentFixture<ExamComponent>;
  let component: ExamComponent;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['submitExam']);

    await TestBed.configureTestingModule({
      imports: [ExamComponent],
      providers: [
        provideRouter([
          { path: 'student/results', component: DummyComponent },
          { path: 'student/dashboard', component: DummyComponent }
        ]),
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    // Provide exam data via router state
    spyOn(router, 'getCurrentNavigation').and.returnValue({
      extras: { state: { examData: mockExamData } },
    } as any);

    fixture = TestBed.createComponent(ExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component.timerInterval) clearInterval(component.timerInterval);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exam data from router state', () => {
    expect(component.examData).toEqual(mockExamData);
  });

  it('should initialize timer with correct duration in seconds', () => {
    expect(component.timeRemaining).toBeGreaterThan(mockExamData.durationMinutes * 60 - 2);
    expect(component.timeRemaining).toBeLessThanOrEqual(mockExamData.durationMinutes * 60);
  });

  it('should start with question index 0', () => {
    expect(component.currentIndex).toBe(0);
  });

  it('should initialize all answers as null', () => {
    mockExamData.questions.forEach(q => {
      expect(component.getAnswerForQuestion(q.id)).toBeNull();
    });
  });

  it('should return correct total question count', () => {
    expect(component.totalQuestions).toBe(mockExamData.questions.length);
  });

  it('should set answered count to 0 initially', () => {
    expect(component.answeredCount).toBe(0);
  });

  it('selectOption should record the answer for current question', () => {
    component.currentIndex = 0;
    component.selectOption('B');
    expect(component.getAnswerForQuestion(101)).toBe('B');
  });

  it('selectOption should update answeredCount', () => {
    component.selectOption('B');
    expect(component.answeredCount).toBe(1);
  });

  it('isAnswered should return true after selecting an option', () => {
    component.selectOption('A');
    expect(component.isAnswered(101)).toBeTrue();
  });

  it('goTo should change currentIndex within bounds', () => {
    component.goTo(1);
    expect(component.currentIndex).toBe(1);

    component.goTo(0);
    expect(component.currentIndex).toBe(0);
  });

  it('goTo should not go out of bounds', () => {
    component.goTo(-1);
    expect(component.currentIndex).toBe(0);

    component.goTo(100);
    expect(component.currentIndex).toBe(0);
  });

  it('next() should advance to the next question', () => {
    component.next();
    expect(component.currentIndex).toBe(1);
  });

  it('prev() should go back to the previous question', () => {
    component.currentIndex = 2;
    component.prev();
    expect(component.currentIndex).toBe(1);
  });

  it('formattedTime should format seconds as mm:ss', () => {
    component.timeRemaining = 125;
    expect(component.formattedTime).toBe('02:05');
  });

  it('timerClass should be timer-danger when <= 60 seconds', () => {
    component.timeRemaining = 30;
    expect(component.timerClass).toBe('timer-danger');
  });

  it('timerClass should be timer-warning when <= 300 seconds', () => {
    component.timeRemaining = 200;
    expect(component.timerClass).toBe('timer-warning');
  });

  it('timerClass should be timer-normal when > 300 seconds', () => {
    component.timeRemaining = 600;
    expect(component.timerClass).toBe('timer-normal');
  });

  it('should call apiService.submitExam with answers when submitExam is called', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const mockResult: ResultDto = {
      attemptId: 1,
      examPaperId: 10,
      examTitle: 'Sample Exam',
      subject: 'Math',
      score: 4,
      totalMarks: 10,
      correctCount: 2,
      incorrectCount: 1,
      totalQuestions: 3,
      submittedAt: new Date().toISOString(),
    };
    apiServiceSpy.submitExam.and.returnValue(of(mockResult));

    component.submitExam();

    expect(apiServiceSpy.submitExam).toHaveBeenCalledWith({
      attemptId: mockExamData.attemptId,
      answers: mockExamData.questions.map(q => ({ questionId: q.id, selectedOption: null })),
    });
  });

  it('should navigate to results page on successful submission', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    const navigateSpy = spyOn(router, 'navigate').and.stub();
    const mockResult: ResultDto = {
      attemptId: 1,
      examPaperId: 10,
      examTitle: 'Sample Exam',
      subject: 'Math',
      score: 10,
      totalMarks: 10,
      correctCount: 5,
      incorrectCount: 0,
      totalQuestions: 5,
      submittedAt: new Date().toISOString(),
    };
    apiServiceSpy.submitExam.and.returnValue(of(mockResult));

    component.submitExam();

    expect(navigateSpy).toHaveBeenCalledWith(['/student/results'], { state: { result: mockResult } });
  });

  it('should show error message on submission failure', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.submitExam.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

    component.submitExam();

    expect(component.errorMessage).toBeTruthy();
    expect(component.isSubmitting).toBeFalse();
  });
});
