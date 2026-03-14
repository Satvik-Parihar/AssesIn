import { Routes } from '@angular/router';
import { authGuard, adminGuard, studentGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'exams/:id', loadComponent: () => import('./features/admin/exam-detail/exam-detail.component').then(m => m.AdminExamDetailComponent) },
      { path: 'create-exam', loadComponent: () => import('./features/admin/create-exam/create-exam.component').then(m => m.CreateExamComponent) },
      { path: 'add-questions', loadComponent: () => import('./features/admin/add-questions/add-questions.component').then(m => m.AddQuestionsComponent) },
      { path: 'generate-sets', loadComponent: () => import('./features/admin/generate-sets/generate-sets.component').then(m => m.GenerateSetsComponent) },
      { path: 'results', loadComponent: () => import('./features/admin/view-results/view-results.component').then(m => m.ViewResultsComponent) },
      { path: 'manage-students', loadComponent: () => import('./features/admin/manage-students/manage-students.component').then(m => m.ManageStudentsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'student',
    canActivate: [authGuard, studentGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/student/dashboard/dashboard.component').then(m => m.StudentDashboardComponent) },
      { path: 'exam', loadComponent: () => import('./features/student/exam/exam.component').then(m => m.ExamComponent) },
      { path: 'results', loadComponent: () => import('./features/student/results/results.component').then(m => m.StudentResultsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
