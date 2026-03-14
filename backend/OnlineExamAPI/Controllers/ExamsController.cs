using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Data;
using OnlineExamAPI.DTOs;
using OnlineExamAPI.Models;
using OnlineExamAPI.Services;

namespace OnlineExamAPI.Controllers;

[ApiController]
[Route("api/exams")]
public class ExamsController : ControllerBase
{
    private readonly AppDbContext _db;

    public ExamsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateExam([FromBody] ExamCreateRequest request)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Subject))
            return BadRequest(new { message = "Title and subject are required." });

        if (request.DurationMinutes <= 0 || request.TotalMarks <= 0)
            return BadRequest(new { message = "Duration and total marks must be positive." });

        var exam = new ExamPaper
        {
            CreatedByAdminId = adminId,
            Title = request.Title.Trim(),
            Subject = request.Subject.Trim(),
            DurationMinutes = request.DurationMinutes,
            TotalMarks = request.TotalMarks,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _db.ExamPapers.Add(exam);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Exam created successfully.", examId = exam.Id });
    }

    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetExams()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var now = DateTime.UtcNow;

        var query = _db.ExamPapers.Where(e => e.IsActive);

        if (role == "Admin")
        {
            query = query.Where(e => e.CreatedByAdminId == userId);
        }

        // Students only see exams that are currently live within the validity window
        if (role == "Student")
        {
            var student = await _db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.Role == "Student")
                .Select(u => new { u.CreatedByAdminId })
                .FirstOrDefaultAsync();

            if (student?.CreatedByAdminId is null)
                return Ok(Array.Empty<ExamListDto>());

            query = query.Where(e =>
                e.CreatedByAdminId == student.CreatedByAdminId.Value &&
                e.IsLive &&
                e.StartTime <= now &&
                e.EndTime >= now);
        }

        var exams = await query
            .OrderByDescending(e => e.CreatedAt)
            .Select(e => new ExamListDto(
                e.Id,
                e.Title,
                e.Subject,
                e.DurationMinutes,
                e.TotalMarks,
                e.Questions.Count,
                e.CreatedAt,
                e.IsLive,
                e.StartTime,
                e.EndTime,
                ResolveExamStatus(e.IsLive, e.StartTime, e.EndTime, now)
            ))
            .ToListAsync();

        return Ok(exams);
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<IActionResult> GetExam(int id)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var exam = await _db.ExamPapers
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exam is null) return NotFound(new { message = "Exam not found." });

        if (role == "Admin" && exam.CreatedByAdminId != userId)
            return NotFound(new { message = "Exam not found." });

        if (role == "Student")
        {
            var student = await _db.Users
                .AsNoTracking()
                .Where(u => u.Id == userId && u.Role == "Student")
                .Select(u => new { u.CreatedByAdminId })
                .FirstOrDefaultAsync();

            if (student?.CreatedByAdminId is null || exam.CreatedByAdminId != student.CreatedByAdminId.Value)
                return NotFound(new { message = "Exam not found." });
        }

        return Ok(new ExamListDto(
            exam.Id, exam.Title, exam.Subject, exam.DurationMinutes,
            exam.TotalMarks, exam.Questions.Count, exam.CreatedAt,
            exam.IsLive, exam.StartTime, exam.EndTime,
            ResolveExamStatus(exam.IsLive, exam.StartTime, exam.EndTime, DateTime.UtcNow)));
    }

    [HttpGet("{id:int}/admin-detail")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAdminExamDetail(int id)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var exam = await _db.ExamPapers
            .Include(e => e.Questions)
            .Include(e => e.Attempts)
                .ThenInclude(a => a.User)
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive && e.CreatedByAdminId == adminId);

        if (exam is null)
            return NotFound(new { message = "Exam not found." });

        var attempts = exam.Attempts
            .Where(a => a.User.CreatedByAdminId == adminId)
            .OrderByDescending(a => a.StartedAt)
            .Select(a => new AdminExamAttemptDto(
                a.Id,
                a.User.FullName,
                a.User.Email,
                a.User.InstituteName,
                a.IsCompleted,
                a.Score,
                a.TotalMarks,
                a.CorrectCount,
                a.IncorrectCount,
                exam.Questions.Count,
                a.IsCompleted && a.TotalMarks > 0 ? Math.Round((double)a.Score / a.TotalMarks * 100, 2) : 0,
                a.StartedAt,
                a.SubmittedAt
            ))
            .ToList();

        var detail = new AdminExamDetailDto(
            exam.Id,
            exam.Title,
            exam.Subject,
            exam.DurationMinutes,
            exam.TotalMarks,
            exam.Questions.Count,
            exam.IsLive,
            exam.StartTime,
            exam.EndTime,
            attempts.Count,
            attempts.Count(a => a.IsCompleted),
            attempts
        );

        return Ok(detail);
    }

    [HttpPost("generateSets")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GenerateSets([FromBody] GenerateSetsRequest request)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (request.NumberOfSets < 1 || request.NumberOfSets > 5)
            return BadRequest(new { message = "Number of sets must be between 1 and 5." });

        var now = DateTime.UtcNow;
        var startUtc = request.StartTime.ToUniversalTime();
        var endUtc = request.EndTime.ToUniversalTime();

        if (startUtc < now)
            return BadRequest(new { message = "Start time cannot be in the past." });

        if (endUtc <= startUtc)
            return BadRequest(new { message = "End time must be after start time." });

        var exam = await _db.ExamPapers
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e => e.Id == request.ExamPaperId && e.IsActive && e.CreatedByAdminId == adminId);

        if (exam is null)
            return NotFound(new { message = "Exam not found." });

        var questions = exam.Questions.ToList();

        if (questions.Count == 0)
            return BadRequest(new { message = "No questions found for this exam." });

        var totalQuestionMarks = questions.Sum(q => q.Marks);
        if (totalQuestionMarks != exam.TotalMarks)
        {
            var markBreakdown = questions
                .OrderBy(q => q.Id)
                .Select(q => new
                {
                    questionId = q.Id,
                    marks = q.Marks
                })
                .ToList();

            return BadRequest(new
            {
                message = $"Cannot publish exam. Sum of question marks ({totalQuestionMarks}) must match exam total marks ({exam.TotalMarks}).",
                expectedTotalMarks = exam.TotalMarks,
                actualTotalQuestionMarks = totalQuestionMarks,
                questionCount = questions.Count,
                markBreakdown
            });
        }

        // Delete old sets for this exam
        var oldSets = await _db.QuestionSets
            .Where(qs => qs.ExamPaperId == request.ExamPaperId)
            .Include(qs => qs.Items)
            .ToListAsync();
        _db.QuestionSets.RemoveRange(oldSets);
        await _db.SaveChangesAsync();

        var setNames = new[] { "Set A", "Set B", "Set C", "Set D", "Set E" };

        for (int i = 0; i < request.NumberOfSets; i++)
        {
            var shuffled = ShuffleService.FisherYatesShuffle(questions);
            var questionSet = new QuestionSet
            {
                ExamPaperId = request.ExamPaperId,
                SetName = setNames[i]
            };
            _db.QuestionSets.Add(questionSet);
            await _db.SaveChangesAsync();

            var items = shuffled.Select((q, idx) => new QuestionSetItem
            {
                QuestionSetId = questionSet.Id,
                QuestionId = q.Id,
                DisplayOrder = idx + 1
            }).ToList();

            _db.QuestionSetItems.AddRange(items);
        }

        // Publish the exam with validity period
        exam.IsLive = true;
        exam.StartTime = startUtc;
        exam.EndTime = endUtc;

        await _db.SaveChangesAsync();
        return Ok(new { message = $"{request.NumberOfSets} question set(s) generated. Exam is now live from {request.StartTime:g} to {request.EndTime:g}." });
    }

    [HttpPost("{id:int}/end")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> EndExam(int id)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var exam = await _db.ExamPapers
            .FirstOrDefaultAsync(e => e.Id == id && e.IsActive && e.CreatedByAdminId == adminId);
        if (exam is null)
            return NotFound(new { message = "Exam not found." });

        var now = DateTime.UtcNow;
        if (exam.EndTime.HasValue && exam.EndTime.Value <= now)
        {
            exam.IsLive = false;
            await _db.SaveChangesAsync();
            return BadRequest(new { message = "Exam is already ended." });
        }

        if (!exam.IsLive)
            return BadRequest(new { message = "Exam is not currently live." });

        exam.IsLive = false;
        exam.EndTime = now;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Exam ended successfully." });
    }

    [HttpPost("start")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> StartExam([FromBody] StartExamRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var student = await _db.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.Role == "Student")
            .Select(u => new { u.CreatedByAdminId })
            .FirstOrDefaultAsync();

        if (student?.CreatedByAdminId is null)
            return Unauthorized(new { message = "Your student account is not linked to an admin." });

        var exam = await _db.ExamPapers
            .Include(e => e.Questions)
            .FirstOrDefaultAsync(e =>
                e.Id == request.ExamPaperId &&
                e.IsActive &&
                e.CreatedByAdminId == student.CreatedByAdminId.Value);

        if (exam is null) return NotFound(new { message = "Exam not found." });
        if (exam.Questions.Count == 0) return BadRequest(new { message = "This exam has no questions yet." });

        var totalQuestionMarks = exam.Questions.Sum(q => q.Marks);
        if (totalQuestionMarks != exam.TotalMarks)
            return BadRequest(new
            {
                message = $"This exam cannot be started. Sum of question marks ({totalQuestionMarks}) must match exam total marks ({exam.TotalMarks})."
            });

        // Enforce validity window
        var now = DateTime.UtcNow;
        if (!exam.IsLive)
            return BadRequest(new { message = "This exam has not been published yet." });
        if (exam.StartTime.HasValue && now < exam.StartTime.Value)
            return BadRequest(new { message = $"This exam starts at {exam.StartTime.Value.ToLocalTime():g}." });
        if (exam.EndTime.HasValue && now > exam.EndTime.Value)
            return BadRequest(new { message = "This exam has ended and is no longer available." });

        var completedAttempt = await _db.StudentAttempts
            .AnyAsync(a => a.UserId == userId && a.ExamPaperId == request.ExamPaperId && a.IsCompleted);
        if (completedAttempt)
            return BadRequest(new { message = "You have already submitted this exam. Reattempt is not allowed." });

        // Check for existing incomplete attempt
        var existing = await _db.StudentAttempts
            .FirstOrDefaultAsync(a => a.UserId == userId && a.ExamPaperId == request.ExamPaperId && !a.IsCompleted);
        if (existing is not null)
        {
            var allowedUntil = GetAllowedUntilUtc(existing.StartedAt, exam.DurationMinutes, exam.EndTime);
            if (DateTime.UtcNow > allowedUntil)
            {
                // Expire stale attempts so students cannot continue after duration/validity window.
                existing.IsCompleted = true;
                existing.SubmittedAt = allowedUntil;
                existing.Score = 0;
                existing.CorrectCount = 0;
                existing.IncorrectCount = 0;
                await _db.SaveChangesAsync();

                return BadRequest(new { message = "Your previous attempt has expired and is treated as submitted. Reattempt is not allowed." });
            }

            // Return the existing incomplete attempt
            var existingQuestions = await GetQuestionsForAttempt(existing, exam);
            return Ok(new StartExamResponse(
                existing.Id, exam.Id, exam.Title, exam.Subject,
                exam.DurationMinutes,
                exam.TotalMarks,
                existing.StartedAt,
                GetAllowedUntilUtc(existing.StartedAt, exam.DurationMinutes, exam.EndTime),
                existingQuestions));
        }

        // Pick a random question set if available
        var sets = await _db.QuestionSets
            .Where(qs => qs.ExamPaperId == request.ExamPaperId)
            .Include(qs => qs.Items)
            .ToListAsync();

        QuestionSet? assignedSet = null;
        List<QuestionDto> questionList;

        if (sets.Count > 0)
        {
            assignedSet = sets[new Random().Next(sets.Count)];
            var orderedItems = assignedSet.Items.OrderBy(i => i.DisplayOrder).ToList();
            var qIds = orderedItems.Select(i => i.QuestionId).ToList();
            var qMap = exam.Questions.ToDictionary(q => q.Id);
            questionList = qIds
                .Where(qid => qMap.ContainsKey(qid))
                .Select(qid => MapQuestion(qMap[qid]))
                .ToList();
        }
        else
        {
            questionList = exam.Questions.Select(MapQuestion).ToList();
        }

        var attempt = new StudentAttempt
        {
            UserId = userId,
            ExamPaperId = exam.Id,
            QuestionSetId = assignedSet?.Id,
            StartedAt = DateTime.UtcNow,
            TotalMarks = exam.TotalMarks
        };

        _db.StudentAttempts.Add(attempt);
        await _db.SaveChangesAsync();

        return Ok(new StartExamResponse(
            attempt.Id, exam.Id, exam.Title, exam.Subject,
            exam.DurationMinutes,
            exam.TotalMarks,
            attempt.StartedAt,
            GetAllowedUntilUtc(attempt.StartedAt, exam.DurationMinutes, exam.EndTime),
            questionList));
    }

    [HttpPost("submit")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> SubmitExam([FromBody] SubmitExamRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var attempt = await _db.StudentAttempts
            .Include(a => a.ExamPaper)
                .ThenInclude(ep => ep.Questions)
            .FirstOrDefaultAsync(a => a.Id == request.AttemptId && a.UserId == userId);

        if (attempt is null) return NotFound(new { message = "Attempt not found." });
        if (attempt.IsCompleted) return BadRequest(new { message = "Exam already submitted." });

        var now = DateTime.UtcNow;
        var allowedUntil = GetAllowedUntilUtc(attempt.StartedAt, attempt.ExamPaper.DurationMinutes, attempt.ExamPaper.EndTime);
        if (now > allowedUntil)
        {
            attempt.IsCompleted = true;
            attempt.SubmittedAt = allowedUntil;
            attempt.Score = 0;
            attempt.CorrectCount = 0;
            attempt.IncorrectCount = 0;
            await _db.SaveChangesAsync();

            return BadRequest(new { message = "Exam duration or validity has expired. Attempt is auto-submitted and reattempt is not allowed." });
        }

        var questionMap = attempt.ExamPaper.Questions.ToDictionary(q => q.Id);
        int score = 0, correct = 0, incorrect = 0;

        var answers = new List<StudentAnswer>();
        foreach (var ans in request.Answers)
        {
            if (!questionMap.TryGetValue(ans.QuestionId, out var question)) continue;

            bool isCorrect = !string.IsNullOrEmpty(ans.SelectedOption) &&
                             ans.SelectedOption.ToUpper() == question.CorrectOption.ToUpper();

            if (isCorrect) { score += question.Marks; correct++; }
            else if (!string.IsNullOrEmpty(ans.SelectedOption)) incorrect++;

            answers.Add(new StudentAnswer
            {
                AttemptId = attempt.Id,
                QuestionId = ans.QuestionId,
                SelectedOption = ans.SelectedOption,
                IsCorrect = isCorrect
            });
        }

        attempt.Score = score;
        attempt.CorrectCount = correct;
        attempt.IncorrectCount = incorrect;
        attempt.IsCompleted = true;
        attempt.SubmittedAt = DateTime.UtcNow;

        _db.StudentAnswers.AddRange(answers);
        await _db.SaveChangesAsync();

        return Ok(new ResultDto(
            attempt.Id,
            attempt.ExamPaperId,
            attempt.ExamPaper.Title,
            attempt.ExamPaper.Subject,
            score,
            attempt.TotalMarks,
            correct,
            incorrect,
            questionMap.Count,
            attempt.SubmittedAt!.Value
        ));
    }

    private static QuestionDto MapQuestion(Question q) =>
        new(q.Id, q.Text, q.OptionA, q.OptionB, q.OptionC, q.OptionD, q.Marks);

    private static string ResolveExamStatus(bool isLive, DateTime? startTime, DateTime? endTime, DateTime now)
    {
        if (startTime is null || endTime is null)
            return isLive ? "Live" : "Draft";

        if (now > endTime.Value)
            return "Ended";

        if (now < startTime.Value)
            return "Upcoming";

        return isLive ? "Live" : "Ended";
    }

    private static DateTime GetAllowedUntilUtc(DateTime startedAt, int durationMinutes, DateTime? examEndTime)
    {
        var durationEnd = startedAt.AddMinutes(durationMinutes);
        return examEndTime.HasValue && examEndTime.Value < durationEnd
            ? examEndTime.Value
            : durationEnd;
    }

    private async Task<List<QuestionDto>> GetQuestionsForAttempt(StudentAttempt attempt, ExamPaper exam)
    {
        if (attempt.QuestionSetId.HasValue)
        {
            var set = await _db.QuestionSets
                .Include(qs => qs.Items)
                .FirstOrDefaultAsync(qs => qs.Id == attempt.QuestionSetId.Value);

            if (set is not null)
            {
                var qMap = exam.Questions.ToDictionary(q => q.Id);
                return set.Items.OrderBy(i => i.DisplayOrder)
                    .Where(i => qMap.ContainsKey(i.QuestionId))
                    .Select(i => MapQuestion(qMap[i.QuestionId]))
                    .ToList();
            }
        }
        return exam.Questions.Select(MapQuestion).ToList();
    }
}
