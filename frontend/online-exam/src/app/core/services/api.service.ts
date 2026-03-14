import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse, LoginRequest, RegisterRequest,
  ExamListDto, QuestionDto, StartExamResponse,
  SubmitExamRequest, ResultDto, AdminResultDto, AdminResultDetailDto,
  DashboardStatsDto, QuestionAddRequest, QuestionAdminDto,
  AdminExamDetailDto,
  StudentListItem, CreateStudentRequest, UpdateStudentRequest
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Auth
  login(body: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, body);
  }

  register(body: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, body);
  }

  // Exams
  getExams(): Observable<ExamListDto[]> {
    return this.http.get<ExamListDto[]>(`${this.base}/exams`);
  }

  getAdminExamDetail(examId: number): Observable<AdminExamDetailDto> {
    return this.http.get<AdminExamDetailDto>(`${this.base}/exams/${examId}/admin-detail`);
  }

  createExam(body: { title: string; subject: string; durationMinutes: number; totalMarks: number }): Observable<any> {
    return this.http.post<any>(`${this.base}/exams/create`, body);
  }

  generateSets(body: { examPaperId: number; numberOfSets: number; startTime: string; endTime: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/exams/generateSets`, body);
  }

  endExam(examId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/exams/${examId}/end`, {});
  }

  startExam(body: { examPaperId: number }): Observable<StartExamResponse> {
    return this.http.post<StartExamResponse>(`${this.base}/exams/start`, body);
  }

  submitExam(body: SubmitExamRequest): Observable<ResultDto> {
    return this.http.post<ResultDto>(`${this.base}/exams/submit`, body);
  }

  // Questions
  addQuestion(body: QuestionAddRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/questions/add`, body);
  }

  getQuestions(examPaperId: number): Observable<QuestionAdminDto[]> {
    return this.http.get<QuestionAdminDto[]>(`${this.base}/questions/${examPaperId}`);
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/questions/${id}`);
  }

  // Results
  getStudentResults(): Observable<ResultDto[]> {
    return this.http.get<ResultDto[]>(`${this.base}/results/student`);
  }

  getAdminResults(): Observable<AdminResultDto[]> {
    return this.http.get<AdminResultDto[]>(`${this.base}/results/admin`);
  }

  getAdminResultDetail(attemptId: number): Observable<AdminResultDetailDto> {
    return this.http.get<AdminResultDetailDto>(`${this.base}/results/admin/${attemptId}`);
  }

  getDashboardStats(): Observable<DashboardStatsDto> {
    return this.http.get<DashboardStatsDto>(`${this.base}/results/admin/stats`);
  }

  // Students (admin only)
  getStudents(): Observable<StudentListItem[]> {
    return this.http.get<StudentListItem[]>(`${this.base}/students`);
  }

  createStudent(body: CreateStudentRequest): Observable<StudentListItem> {
    return this.http.post<StudentListItem>(`${this.base}/students/create`, body);
  }

  updateStudent(id: number, body: UpdateStudentRequest): Observable<StudentListItem> {
    return this.http.put<StudentListItem>(`${this.base}/students/${id}`, body);
  }

  deactivateStudent(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/students/${id}`);
  }
}
