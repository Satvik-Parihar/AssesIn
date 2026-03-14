namespace OnlineExamAPI.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string ConfirmPassword, string InstituteName);
public record LoginRequest(string Email, string Password);

// InstituteName added for role-aware context
public record AuthResponse(string Token, string Role, string FullName, int UserId, string InstituteName = "");

// Admin creates students (not self-registration)
public record CreateStudentRequest(
    string FullName,
    string Email,
    string Password,
    string ConfirmPassword
);

public record UpdateStudentRequest(
    string FullName,
    bool IsActive
);

public record StudentListDto(
    int Id,
    string FullName,
    string Email,
    string InstituteName,
    bool IsActive,
    DateTime CreatedAt
);

public record ExamCreateRequest(string Title, string Subject, int DurationMinutes, int TotalMarks);

public record QuestionAddRequest(
    int ExamPaperId,
    string Text,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string CorrectOption,
    int Marks = 1
);

public record GenerateSetsRequest(int ExamPaperId, int NumberOfSets, DateTime StartTime, DateTime EndTime);

public record StartExamRequest(int ExamPaperId);

public record SubmitAnswerDto(int QuestionId, string? SelectedOption);

public record SubmitExamRequest(int AttemptId, List<SubmitAnswerDto> Answers);

// Response DTOs
public record ExamListDto(
    int Id,
    string Title,
    string Subject,
    int DurationMinutes,
    int TotalMarks,
    int QuestionCount,
    DateTime CreatedAt,
    bool IsLive = false,
    DateTime? StartTime = null,
    DateTime? EndTime = null,
    string Status = "Draft"
);

public record QuestionDto(
    int Id,
    string Text,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    int Marks
);

public record StartExamResponse(
    int AttemptId,
    int ExamPaperId,
    string ExamTitle,
    string Subject,
    int DurationMinutes,
    int TotalMarks,
    DateTime StartedAt,
    DateTime AllowedUntilUtc,
    List<QuestionDto> Questions
);

public record ResultDto(
    int AttemptId,
    int ExamPaperId,
    string ExamTitle,
    string Subject,
    int Score,
    int TotalMarks,
    int CorrectCount,
    int IncorrectCount,
    int TotalQuestions,
    DateTime SubmittedAt
);

public record AdminResultDto(
    int AttemptId,
    string StudentName,
    string StudentEmail,
    string StudentInstitute,
    string ExamTitle,
    string Subject,
    int Score,
    int TotalMarks,
    int CorrectCount,
    int IncorrectCount,
    int TotalQuestions,
    double Percentage,
    DateTime SubmittedAt
);

public record AdminResultAnswerDto(
    int QuestionId,
    string QuestionText,
    string OptionA,
    string OptionB,
    string OptionC,
    string OptionD,
    string CorrectOption,
    string? SelectedOption,
    bool IsCorrect,
    int Marks
);

public record AdminResultDetailDto(
    int AttemptId,
    string StudentName,
    string StudentEmail,
    string StudentInstitute,
    string ExamTitle,
    string Subject,
    int Score,
    int TotalMarks,
    int CorrectCount,
    int IncorrectCount,
    int UnansweredCount,
    int TotalQuestions,
    double Percentage,
    DateTime StartedAt,
    DateTime SubmittedAt,
    List<AdminResultAnswerDto> Answers
);

public record DashboardStatsDto(
    int TotalExams,
    int TotalStudents,
    int TotalAttempts,
    double AverageScore
);

public record AdminExamAttemptDto(
    int AttemptId,
    string StudentName,
    string StudentEmail,
    string StudentInstitute,
    bool IsCompleted,
    int Score,
    int TotalMarks,
    int CorrectCount,
    int IncorrectCount,
    int TotalQuestions,
    double Percentage,
    DateTime StartedAt,
    DateTime? SubmittedAt
);

public record AdminExamDetailDto(
    int Id,
    string Title,
    string Subject,
    int DurationMinutes,
    int TotalMarks,
    int QuestionCount,
    bool IsLive,
    DateTime? StartTime,
    DateTime? EndTime,
    int TotalAttempts,
    int CompletedAttempts,
    List<AdminExamAttemptDto> Attempts
);
