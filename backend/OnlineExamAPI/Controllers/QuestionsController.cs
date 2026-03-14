using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using OnlineExamAPI.Data;
using OnlineExamAPI.DTOs;
using OnlineExamAPI.Models;

namespace OnlineExamAPI.Controllers;

[ApiController]
[Route("api/questions")]
[Authorize(Roles = "Admin")]
public class QuestionsController : ControllerBase
{
    private readonly AppDbContext _db;

    public QuestionsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddQuestion([FromBody] QuestionAddRequest request)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (string.IsNullOrWhiteSpace(request.Text))
            return BadRequest(new { message = "Question text is required." });

        if (string.IsNullOrWhiteSpace(request.OptionA) || string.IsNullOrWhiteSpace(request.OptionB) ||
            string.IsNullOrWhiteSpace(request.OptionC) || string.IsNullOrWhiteSpace(request.OptionD))
            return BadRequest(new { message = "All four options are required." });

        var validOptions = new[] { "A", "B", "C", "D" };
        if (!validOptions.Contains(request.CorrectOption.ToUpper()))
            return BadRequest(new { message = "Correct option must be A, B, C, or D." });

        var examExists = await _db.ExamPapers
            .AnyAsync(e => e.Id == request.ExamPaperId && e.CreatedByAdminId == adminId && e.IsActive);
        if (!examExists) return NotFound(new { message = "Exam not found." });

        var question = new Question
        {
            ExamPaperId = request.ExamPaperId,
            Text = request.Text.Trim(),
            OptionA = request.OptionA.Trim(),
            OptionB = request.OptionB.Trim(),
            OptionC = request.OptionC.Trim(),
            OptionD = request.OptionD.Trim(),
            CorrectOption = request.CorrectOption.ToUpper(),
            Marks = request.Marks > 0 ? request.Marks : 1
        };

        _db.Questions.Add(question);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Question added.", questionId = question.Id });
    }

    [HttpGet("{examPaperId}")]
    public async Task<IActionResult> GetQuestions(int examPaperId)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var hasExamAccess = await _db.ExamPapers
            .AnyAsync(e => e.Id == examPaperId && e.CreatedByAdminId == adminId && e.IsActive);
        if (!hasExamAccess)
            return NotFound(new { message = "Exam not found." });

        var questions = await _db.Questions
            .Where(q => q.ExamPaperId == examPaperId)
            .Select(q => new
            {
                q.Id,
                q.Text,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.CorrectOption,
                q.Marks
            })
            .ToListAsync();

        return Ok(questions);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var question = await _db.Questions
            .Include(q => q.ExamPaper)
            .FirstOrDefaultAsync(q => q.Id == id);
        if (question is null) return NotFound(new { message = "Question not found." });

        if (question.ExamPaper.CreatedByAdminId != adminId || !question.ExamPaper.IsActive)
            return NotFound(new { message = "Question not found." });

        _db.Questions.Remove(question);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Question deleted." });
    }
}
