using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Data;
using OnlineExamAPI.DTOs;

namespace OnlineExamAPI.Controllers;

[ApiController]
[Route("api/results")]
[Authorize]
public class ResultsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ResultsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("student")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetStudentResults()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var results = await _db.StudentAttempts
            .Where(a => a.UserId == userId && a.IsCompleted)
            .Include(a => a.ExamPaper)
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => new ResultDto(
                a.Id,
                a.ExamPaperId,
                a.ExamPaper.Title,
                a.ExamPaper.Subject,
                a.Score,
                a.TotalMarks,
                a.CorrectCount,
                a.IncorrectCount,
                a.ExamPaper.Questions.Count,
                a.SubmittedAt!.Value
            ))
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminResults()
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var results = await _db.StudentAttempts
            .Where(a =>
                a.IsCompleted &&
                a.User.CreatedByAdminId == adminId &&
                a.ExamPaper.CreatedByAdminId == adminId)
            .Include(a => a.User)
            .Include(a => a.ExamPaper)
            .OrderByDescending(a => a.SubmittedAt)
            .Select(a => new AdminResultDto(
                a.Id,
                a.User.FullName,
                a.User.Email,
                a.User.InstituteName,
                a.ExamPaper.Title,
                a.ExamPaper.Subject,
                a.Score,
                a.TotalMarks,
                a.CorrectCount,
                a.IncorrectCount,
                a.ExamPaper.Questions.Count,
                a.TotalMarks > 0 ? Math.Round((double)a.Score / a.TotalMarks * 100, 2) : 0,
                a.SubmittedAt!.Value
            ))
            .ToListAsync();

        return Ok(results);
    }

    [HttpGet("admin/{attemptId:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminResultDetail(int attemptId)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var attempt = await _db.StudentAttempts
            .Include(a => a.User)
            .Include(a => a.ExamPaper)
                .ThenInclude(e => e.Questions)
            .Include(a => a.Answers)
                .ThenInclude(ans => ans.Question)
            .FirstOrDefaultAsync(a =>
                a.Id == attemptId &&
                a.IsCompleted &&
                a.User.CreatedByAdminId == adminId &&
                a.ExamPaper.CreatedByAdminId == adminId);

        if (attempt is null)
            return NotFound(new { message = "Result not found." });

        var answerByQuestionId = attempt.Answers.ToDictionary(a => a.QuestionId, a => a);
        var questionList = attempt.ExamPaper.Questions.OrderBy(q => q.Id).ToList();

        var answers = questionList.Select(q =>
        {
            answerByQuestionId.TryGetValue(q.Id, out var studentAnswer);
            return new AdminResultAnswerDto(
                q.Id,
                q.Text,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.CorrectOption,
                studentAnswer?.SelectedOption,
                studentAnswer?.IsCorrect ?? false,
                q.Marks
            );
        }).ToList();

        var unansweredCount = answers.Count(a => string.IsNullOrWhiteSpace(a.SelectedOption));
        var percentage = attempt.TotalMarks > 0
            ? Math.Round((double)attempt.Score / attempt.TotalMarks * 100, 2)
            : 0;

        var detail = new AdminResultDetailDto(
            attempt.Id,
            attempt.User.FullName,
            attempt.User.Email,
            attempt.User.InstituteName,
            attempt.ExamPaper.Title,
            attempt.ExamPaper.Subject,
            attempt.Score,
            attempt.TotalMarks,
            attempt.CorrectCount,
            attempt.IncorrectCount,
            unansweredCount,
            questionList.Count,
            percentage,
            attempt.StartedAt,
            attempt.SubmittedAt!.Value,
            answers
        );

        return Ok(detail);
    }

    [HttpGet("admin/stats")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var totalExams = await _db.ExamPapers
            .CountAsync(e => e.IsActive && e.CreatedByAdminId == adminId);
        var totalStudents = await _db.Users.CountAsync(u => u.Role == "Student" && u.CreatedByAdminId == adminId);
        var completedAttempts = await _db.StudentAttempts
            .Where(a =>
                a.IsCompleted &&
                a.User.CreatedByAdminId == adminId &&
                a.ExamPaper.CreatedByAdminId == adminId)
            .ToListAsync();

        double avgScore = completedAttempts.Count > 0
            ? completedAttempts.Average(a => a.TotalMarks > 0 ? (double)a.Score / a.TotalMarks * 100 : 0)
            : 0;

        return Ok(new DashboardStatsDto(
            totalExams,
            totalStudents,
            completedAttempts.Count,
            Math.Round(avgScore, 1)
        ));
    }
}
