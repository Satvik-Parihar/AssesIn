# AssesIn - Online Exam System

A full-stack institute-scoped online examination platform built with .NET 8 and Angular 17.

AssesIn enables secure, role-based exam operations with strict institute isolation, timed attempts, randomized question sets, and detailed performance reporting for both admins and students.

---

## Table of Contents

1. Overview
2. Features
3. Tech Stack
4. Architecture
5. Domain Model
6. Project Structure
7. API Overview
8. Exam Lifecycle
9. Security Model
10. Local Setup
11. Configuration
12. Run and Test
13. Data and Seeding Policy
14. Troubleshooting
15. Roadmap
16. License

---

## 1. Overview

AssesIn is designed for educational institutes where:
- Admins create exams and manage students.
- Students can attempt only exams from their institute.
- Reattempts are blocked after submission.
- Exam validity windows and duration are both enforced by the backend.
- Result analytics are available to admins while preserving strict data boundaries.

---

## 2. Features

### Admin Features
- Register and log in as institute admin.
- Create and manage exams.
- Add and remove exam questions.
- Generate randomized question sets (Set A, Set B, etc.).
- Define exam start and end schedule windows.
- Manage institute students (create, update, activate/deactivate).
- View result dashboards and per-attempt detailed answers.

### Student Features
- Log in with institute-linked account.
- See only currently available exams for their institute.
- Attempt timed exams with a live countdown.
- Auto-submit on time expiry.
- View latest result and complete attempt history.

### Platform Rules
- Institute isolation via admin ownership and student-admin linkage.
- No reattempt after a completed attempt.
- Timebox is backend authoritative: min(startedAt + duration, examEndTime).
- Access control with JWT + role-based authorization.

---

## 3. Tech Stack

### Backend
- ASP.NET Core Web API (.NET 8)
- Entity Framework Core 8
- SQL Server
- JWT Bearer Authentication
- BCrypt password hashing
- xUnit test suite

### Frontend
- Angular 17 (standalone components)
- TypeScript
- SCSS
- RxJS
- Karma + Jasmine tests

### Tooling
- Node.js + npm
- EF Core Migrations
- Concurrent startup via custom `start-all` script

---

## 4. Architecture

AssesIn follows a clean client-server architecture:

1. Angular frontend handles UI, routing, and API calls.
2. ASP.NET Core Web API handles authentication, business rules, and persistence.
3. SQL Server stores user, exam, question, attempt, and result data.
4. JWT token carries user identity and role for secured endpoints.

### Request Flow

1. User logs in and receives JWT.
2. Frontend stores token and adds it to outgoing requests via interceptor.
3. Backend validates JWT and role.
4. Controller enforces ownership/institute constraints.
5. Data is returned as DTOs to the frontend.

---

## 5. Domain Model

Core entities:
- `User`: Admin or Student, institute mapping, active status.
- `ExamPaper`: Exam metadata, duration, live status, schedule, owner admin.
- `Question`: MCQ options and correct answer.
- `QuestionSet`: Named randomized set for an exam.
- `QuestionSetItem`: Question ordering inside a set.
- `StudentAttempt`: One attempt per student per exam.
- `StudentAnswer`: Per-question response for an attempt.

---

## 6. Project Structure

```text
OnlineExamSystem/
  backend/
    OnlineExamAPI/
      Controllers/
      Data/
      DTOs/
      Migrations/
      Models/
      Services/
      Program.cs
    OnlineExamAPI.Tests/
      ExamSystemTests.cs
  frontend/
    online-exam/
      src/
        app/
          core/
          features/
          shared/
  scripts/
    start-all.js
```

### Backend Highlights
- `Program.cs`: app bootstrapping and middleware pipeline.
- `Data/AppDbContext.cs`: EF model and relationships.
- `Data/DbSeeder.cs`: migration application and cleanup of legacy demo users.
- `Controllers/`: endpoint groups by domain.
- `DTOs/Dtos.cs`: API contracts.
- `Services/JwtService.cs`: token generation.
- `Services/ShuffleService.cs`: Fisher-Yates shuffle.

### Frontend Highlights
- `app.routes.ts`: lazy-loaded route map and guards.
- `core/services/api.service.ts`: centralized API client.
- `core/interceptors/auth.interceptor.ts`: JWT injection.
- `features/admin/*`: exam creation, student management, reporting.
- `features/student/*`: exam taking and results.

---

## 7. API Overview

Base URL:
- `http://localhost:5000/api`

Primary endpoint groups:
- `/auth`: register/login.
- `/students`: admin student management.
- `/exams`: exam create/list/publish/start/submit/end.
- `/questions`: question CRUD for admin-owned exams.
- `/results`: student and admin result views.

---

## 8. Exam Lifecycle

1. Admin creates an exam.
2. Admin adds questions.
3. Admin publishes with set count and schedule window.
4. Student starts exam (assigned a question set).
5. Attempt window starts with server-computed deadline.
6. Student submits manually or auto-submit happens on expiry.
7. Result is computed and persisted.
8. Reattempt is blocked for completed attempts.

---

## 9. Security Model

- Passwords stored as BCrypt hashes.
- JWT token contains role and identity claims.
- Role-based `[Authorize]` attributes on controllers/actions.
- Ownership checks in query filters protect institute boundaries.
- CORS scoped to frontend origin during local dev.

---

## 10. Local Setup

### Prerequisites
- .NET SDK 8+
- Node.js 18+
- SQL Server instance

### Clone and install

```bash
git clone https://github.com/Satvik-Parihar/AssesIn.git
cd AssesIn
npm install
cd frontend/online-exam
npm install
cd ../..
```

### Configure backend

Edit:
- `backend/OnlineExamAPI/appsettings.json`

Set:
- `ConnectionStrings:DefaultConnection`
- `Jwt:Key`
- `Jwt:Issuer`
- `Jwt:Audience`

---

## 11. Configuration

### Example `appsettings.json` (shape)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=...;Database=OnlineExamSystem;Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Jwt": {
    "Key": "your-very-strong-secret-key",
    "Issuer": "OnlineExamAPI",
    "Audience": "OnlineExamClient"
  }
}
```

Use a long random key in real deployments.

---

## 12. Run and Test

### Start both backend and frontend

```bash
npm run start-all
```

### Backend tests

```bash
npm run test:backend
```

### Frontend tests

```bash
npm run test:frontend
```

---

## 13. Data and Seeding Policy

- Automatic schema migration runs at startup.
- Legacy demo users are cleaned if found.
- No default admin/student test accounts are inserted anymore.

This ensures a clean production-ready baseline.

---

## 14. Troubleshooting

### API not starting
- Verify SQL Server connectivity.
- Confirm connection string in `appsettings.json`.
- Check if port 5000 is free.

### Frontend cannot call API
- Ensure backend is running on `http://localhost:5000`.
- Confirm CORS policy allows `http://localhost:4200`.
- Verify `environment.ts` API URL.

### 401 Unauthorized
- Re-login to refresh JWT.
- Ensure interceptor is registered in `app.config.ts`.

### Migration issues
- Run backend once to apply migrations automatically.
- Validate SQL permissions for migration operations.

---

## 15. Roadmap

- Add Docker and docker-compose setup.
- Add CI/CD with GitHub Actions.
- Add refresh token flow.
- Add richer analytics and export features.
- Add proctoring and anti-cheat modules.
- Add pagination and advanced filters to results.

---

## 16. License

This project is currently unlicensed.

If you intend open-source distribution, add an explicit license file such as MIT or Apache-2.0.
