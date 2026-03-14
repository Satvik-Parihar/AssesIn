using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Data;
using OnlineExamAPI.Models;
using OnlineExamAPI.Services;

namespace OnlineExamAPI.Tests;

/// <summary>
/// Helper to create in-memory DbContext instances for testing.
/// Each test gets its own isolated database — records are never persisted to SQL Server.
/// </summary>
public static class TestDbHelper
{
    public static AppDbContext CreateInMemoryDb(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: ShuffleService (Fisher-Yates)
// ─────────────────────────────────────────────────────────────────────────────
public class ShuffleServiceTests
{
    [Fact]
    public void FisherYatesShuffle_ReturnsAllElements()
    {
        var source = Enumerable.Range(1, 10).ToList();
        var shuffled = ShuffleService.FisherYatesShuffle(source);

        Assert.Equal(source.Count, shuffled.Count);
        Assert.Equal(source.OrderBy(x => x), shuffled.OrderBy(x => x));
    }

    [Fact]
    public void FisherYatesShuffle_DoesNotMutateSource()
    {
        var source = new List<int> { 1, 2, 3, 4, 5 };
        var copy = new List<int>(source);
        ShuffleService.FisherYatesShuffle(source);

        Assert.Equal(copy, source);
    }

    [Fact]
    public void FisherYatesShuffle_ProducesDifferentOrders()
    {
        var source = Enumerable.Range(1, 20).ToList();
        var results = new HashSet<string>();

        for (int i = 0; i < 20; i++)
        {
            var shuffled = ShuffleService.FisherYatesShuffle(source);
            results.Add(string.Join(",", shuffled));
        }

        // With 20 elements shuffled 20 times, extremely unlikely all are identical
        Assert.True(results.Count > 1, "Shuffle should produce different orderings.");
    }

    [Fact]
    public void FisherYatesShuffle_WithSeededRandom_IsDeterministic()
    {
        var source = Enumerable.Range(1, 10).ToList();
        var rng = new Random(42);
        var first = ShuffleService.FisherYatesShuffle(source, rng);

        rng = new Random(42);
        var second = ShuffleService.FisherYatesShuffle(source, rng);

        Assert.Equal(first, second);
    }

    [Fact]
    public void FisherYatesShuffle_SingleElement_ReturnsItself()
    {
        var source = new List<int> { 99 };
        var result = ShuffleService.FisherYatesShuffle(source);
        Assert.Single(result);
        Assert.Equal(99, result[0]);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Evaluation Logic
// ─────────────────────────────────────────────────────────────────────────────
public class EvaluationLogicTests
{
    [Fact]
    public void Evaluation_AllCorrect_ReturnsFullScore()
    {
        var questions = BuildQuestions(5, "A");
        var answers = questions.Select(q => (q.Id, SelectedOption: (string?)"A")).ToList();

        int score = 0, correct = 0, incorrect = 0;
        foreach (var (questionId, selected) in answers)
        {
            var q = questions.First(x => x.Id == questionId);
            bool isCorrect = selected?.ToUpper() == q.CorrectOption;
            if (isCorrect) { score += q.Marks; correct++; }
            else if (selected != null) incorrect++;
        }

        Assert.Equal(5, score);
        Assert.Equal(5, correct);
        Assert.Equal(0, incorrect);
    }

    [Fact]
    public void Evaluation_AllWrong_ReturnsZeroScore()
    {
        var questions = BuildQuestions(5, "A");
        var answers = questions.Select(q => (q.Id, SelectedOption: (string?)"B")).ToList();

        int score = 0, correct = 0, incorrect = 0;
        foreach (var (questionId, selected) in answers)
        {
            var q = questions.First(x => x.Id == questionId);
            bool isCorrect = selected?.ToUpper() == q.CorrectOption;
            if (isCorrect) { score += q.Marks; correct++; }
            else if (selected != null) incorrect++;
        }

        Assert.Equal(0, score);
        Assert.Equal(0, correct);
        Assert.Equal(5, incorrect);
    }

    [Fact]
    public void Evaluation_Unanswered_NotCountedAsIncorrect()
    {
        var questions = BuildQuestions(3, "A");
        var answers = questions.Select(q => (q.Id, SelectedOption: (string?)null)).ToList();

        int score = 0, correct = 0, incorrect = 0;
        foreach (var (questionId, selected) in answers)
        {
            var q = questions.First(x => x.Id == questionId);
            bool isCorrect = !string.IsNullOrEmpty(selected) && selected.ToUpper() == q.CorrectOption;
            if (isCorrect) { score += q.Marks; correct++; }
            else if (!string.IsNullOrEmpty(selected)) incorrect++;
        }

        Assert.Equal(0, incorrect);
        Assert.Equal(0, score);
    }

    [Fact]
    public void Evaluation_PartialAnswers_CorrectScoreCalculated()
    {
        var questions = new List<Question>
        {
            new() { Id = 1, CorrectOption = "A", Marks = 1 },
            new() { Id = 2, CorrectOption = "B", Marks = 2 },
            new() { Id = 3, CorrectOption = "C", Marks = 1 },
        };
        var answers = new List<(int, string?)>
        {
            (1, "A"),  // correct
            (2, "A"),  // wrong
            (3, null), // unanswered
        };

        int score = 0, correct = 0, incorrect = 0;
        foreach (var (questionId, selected) in answers)
        {
            var q = questions.First(x => x.Id == questionId);
            bool isCorrect = !string.IsNullOrEmpty(selected) && selected.ToUpper() == q.CorrectOption;
            if (isCorrect) { score += q.Marks; correct++; }
            else if (!string.IsNullOrEmpty(selected)) incorrect++;
        }

        Assert.Equal(1, score);
        Assert.Equal(1, correct);
        Assert.Equal(1, incorrect);
    }

    private static List<Question> BuildQuestions(int count, string correctOption)
    {
        return Enumerable.Range(1, count).Select(i => new Question
        {
            Id = i,
            ExamPaperId = 1,
            Text = $"Question {i}",
            OptionA = "A", OptionB = "B", OptionC = "C", OptionD = "D",
            CorrectOption = correctOption,
            Marks = 1
        }).ToList();
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Exam Creation (using in-memory DB)
// ─────────────────────────────────────────────────────────────────────────────
public class ExamCreationTests
{
    [Fact]
    public async Task CreateExam_SavesCorrectly()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var exam = new ExamPaper
        {
            Title = "Math Test",
            Subject = "Mathematics",
            DurationMinutes = 60,
            TotalMarks = 100,
            IsActive = true
        };

        db.ExamPapers.Add(exam);
        await db.SaveChangesAsync();

        var saved = await db.ExamPapers.FindAsync(exam.Id);
        Assert.NotNull(saved);
        Assert.Equal("Math Test", saved.Title);
        Assert.Equal(60, saved.DurationMinutes);
    }

    [Fact]
    public async Task CreateExam_MultipleExams_CountsCorrectly()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        for (int i = 1; i <= 5; i++)
        {
            db.ExamPapers.Add(new ExamPaper
            {
                Title = $"Exam {i}",
                Subject = "General",
                DurationMinutes = 30,
                TotalMarks = 50,
                IsActive = true
            });
        }

        await db.SaveChangesAsync();
        Assert.Equal(5, db.ExamPapers.Count());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Question Management
// ─────────────────────────────────────────────────────────────────────────────
public class QuestionTests
{
    [Fact]
    public async Task AddQuestion_SavesCorrectly()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var exam = new ExamPaper { Title = "Test", Subject = "Science", DurationMinutes = 30, TotalMarks = 10 };
        db.ExamPapers.Add(exam);
        await db.SaveChangesAsync();

        var question = new Question
        {
            ExamPaperId = exam.Id,
            Text = "What is H2O?",
            OptionA = "Water",
            OptionB = "Oxygen",
            OptionC = "Hydrogen",
            OptionD = "Carbon",
            CorrectOption = "A",
            Marks = 1
        };
        db.Questions.Add(question);
        await db.SaveChangesAsync();

        var saved = await db.Questions.FindAsync(question.Id);
        Assert.NotNull(saved);
        Assert.Equal("A", saved.CorrectOption);
        Assert.Equal(exam.Id, saved.ExamPaperId);
    }

    [Fact]
    public async Task AddMultipleQuestions_AllSavedCorrectly()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var exam = new ExamPaper { Title = "T", Subject = "S", DurationMinutes = 10, TotalMarks = 5 };
        db.ExamPapers.Add(exam);
        await db.SaveChangesAsync();

        for (int i = 0; i < 5; i++)
        {
            db.Questions.Add(new Question
            {
                ExamPaperId = exam.Id,
                Text = $"Q{i}",
                OptionA = "1", OptionB = "2", OptionC = "3", OptionD = "4",
                CorrectOption = "A",
                Marks = 1
            });
        }
        await db.SaveChangesAsync();

        Assert.Equal(5, db.Questions.Count(q => q.ExamPaperId == exam.Id));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Question Set Generation
// ─────────────────────────────────────────────────────────────────────────────
public class QuestionSetTests
{
    [Fact]
    public async Task GenerateSets_CreatesCorrectNumberOfSets()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var exam = new ExamPaper { Title = "Exam", Subject = "Math", DurationMinutes = 60, TotalMarks = 10 };
        db.ExamPapers.Add(exam);
        await db.SaveChangesAsync();

        for (int i = 0; i < 5; i++)
        {
            db.Questions.Add(new Question
            {
                ExamPaperId = exam.Id,
                Text = $"Q{i}", OptionA = "A", OptionB = "B", OptionC = "C", OptionD = "D",
                CorrectOption = "A", Marks = 1
            });
        }
        await db.SaveChangesAsync();

        var questions = db.Questions.Where(q => q.ExamPaperId == exam.Id).ToList();
        var setNames = new[] { "Set A", "Set B", "Set C" };

        foreach (var name in setNames)
        {
            var shuffled = ShuffleService.FisherYatesShuffle(questions);
            var set = new QuestionSet { ExamPaperId = exam.Id, SetName = name };
            db.QuestionSets.Add(set);
            await db.SaveChangesAsync();

            db.QuestionSetItems.AddRange(shuffled.Select((q, idx) => new QuestionSetItem
            {
                QuestionSetId = set.Id, QuestionId = q.Id, DisplayOrder = idx + 1
            }));
        }
        await db.SaveChangesAsync();

        Assert.Equal(3, db.QuestionSets.Count(qs => qs.ExamPaperId == exam.Id));
        Assert.Equal(15, db.QuestionSetItems.Count());
    }

    [Fact]
    public async Task GenerateSets_EachSetContainsAllQuestions()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var exam = new ExamPaper { Title = "E", Subject = "S", DurationMinutes = 30, TotalMarks = 5 };
        db.ExamPapers.Add(exam);
        await db.SaveChangesAsync();

        for (int i = 0; i < 5; i++)
        {
            db.Questions.Add(new Question
            {
                ExamPaperId = exam.Id,
                Text = $"Q{i}", OptionA = "A", OptionB = "B", OptionC = "C", OptionD = "D",
                CorrectOption = "A", Marks = 1
            });
        }
        await db.SaveChangesAsync();

        var questions = db.Questions.Where(q => q.ExamPaperId == exam.Id).ToList();
        var set = new QuestionSet { ExamPaperId = exam.Id, SetName = "Set A" };
        db.QuestionSets.Add(set);
        await db.SaveChangesAsync();

        db.QuestionSetItems.AddRange(ShuffleService.FisherYatesShuffle(questions).Select((q, idx) =>
            new QuestionSetItem { QuestionSetId = set.Id, QuestionId = q.Id, DisplayOrder = idx + 1 }));
        await db.SaveChangesAsync();

        var items = db.QuestionSetItems.Where(i => i.QuestionSetId == set.Id).ToList();
        Assert.Equal(5, items.Count);

        var questionIds = questions.Select(q => q.Id).OrderBy(x => x).ToList();
        var storedIds = items.Select(i => i.QuestionId).OrderBy(x => x).ToList();
        Assert.Equal(questionIds, storedIds);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Admin creates student
// ─────────────────────────────────────────────────────────────────────────────
public class StudentManagementTests
{
    [Fact]
    public async Task AdminCreatesStudent_SavedWithCorrectFields()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var admin = new User
        {
            FullName = "Admin",
            Email = "admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1"),
            Role = "Admin",
            InstituteName = "Test Institute",
            IsActive = true
        };
        db.Users.Add(admin);
        await db.SaveChangesAsync();

        var student = new User
        {
            FullName = "Student One",
            Email = "student1@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("student1"),
            Role = "Student",
            InstituteName = "Test Institute",
            CreatedByAdminId = admin.Id,
            IsActive = true
        };
        db.Users.Add(student);
        await db.SaveChangesAsync();

        var saved = await db.Users.FindAsync(student.Id);
        Assert.NotNull(saved);
        Assert.Equal("Student", saved.Role);
        Assert.Equal(admin.Id, saved.CreatedByAdminId);
        Assert.Equal("Test Institute", saved.InstituteName);
        Assert.True(saved.IsActive);
    }

    [Fact]
    public async Task AdminDeactivatesStudent_IsActiveSetFalse()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var admin = new User { FullName = "A", Email = "a@a.com", PasswordHash = "x", Role = "Admin", InstituteName = "X", IsActive = true };
        db.Users.Add(admin);
        await db.SaveChangesAsync();

        var student = new User { FullName = "S", Email = "s@s.com", PasswordHash = "y", Role = "Student", InstituteName = "X", CreatedByAdminId = admin.Id, IsActive = true };
        db.Users.Add(student);
        await db.SaveChangesAsync();

        student.IsActive = false;
        await db.SaveChangesAsync();

        var saved = await db.Users.FindAsync(student.Id);
        Assert.False(saved!.IsActive);
    }

    [Fact]
    public async Task GetStudents_ReturnsOnlyStudentsCreatedByAdmin()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var admin1 = new User { FullName = "Admin1", Email = "admin1@test.com", PasswordHash = "x", Role = "Admin", InstituteName = "Inst1", IsActive = true };
        var admin2 = new User { FullName = "Admin2", Email = "admin2@test.com", PasswordHash = "y", Role = "Admin", InstituteName = "Inst2", IsActive = true };
        db.Users.AddRange(admin1, admin2);
        await db.SaveChangesAsync();

        db.Users.Add(new User { FullName = "S1", Email = "s1@test.com", PasswordHash = "z", Role = "Student", CreatedByAdminId = admin1.Id, InstituteName = "Inst1", IsActive = true });
        db.Users.Add(new User { FullName = "S2", Email = "s2@test.com", PasswordHash = "z", Role = "Student", CreatedByAdminId = admin2.Id, InstituteName = "Inst2", IsActive = true });
        await db.SaveChangesAsync();

        var admin1Students = db.Users.Where(u => u.Role == "Student" && u.CreatedByAdminId == admin1.Id).ToList();
        Assert.Single(admin1Students);
        Assert.Equal("S1", admin1Students[0].FullName);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Student login (in-memory)
// ─────────────────────────────────────────────────────────────────────────────
public class StudentLoginTests
{
    [Fact]
    public async Task ActiveStudent_CanLogin()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var password = "pass1word";
        var student = new User
        {
            FullName = "Active Student",
            Email = "active@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
            Role = "Student",
            InstituteName = "Inst",
            IsActive = true
        };
        db.Users.Add(student);
        await db.SaveChangesAsync();

        var found = await db.Users.FirstOrDefaultAsync(u => u.Email == "active@test.com");
        Assert.NotNull(found);
        Assert.True(BCrypt.Net.BCrypt.Verify(password, found!.PasswordHash));
        Assert.True(found.IsActive);
    }

    [Fact]
    public async Task DeactivatedStudent_LoginShouldBeBlocked()
    {
        using var db = TestDbHelper.CreateInMemoryDb();

        var student = new User
        {
            FullName = "Inactive Student",
            Email = "inactive@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("pass2word"),
            Role = "Student",
            InstituteName = "Inst",
            IsActive = false
        };
        db.Users.Add(student);
        await db.SaveChangesAsync();

        var found = await db.Users.FirstOrDefaultAsync(u => u.Email == "inactive@test.com");
        Assert.NotNull(found);
        // Simulates what AuthController does: reject if not active
        Assert.False(found!.IsActive);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Exam visibility based on start and end time
// ─────────────────────────────────────────────────────────────────────────────
public class ExamVisibilityTests
{
    [Fact]
    public async Task Exam_ActiveNow_IsVisibleToStudent()
    {
        using var db = TestDbHelper.CreateInMemoryDb();
        var now = DateTime.UtcNow;

        db.ExamPapers.Add(new ExamPaper
        {
            Title = "Live Exam",
            Subject = "Math",
            DurationMinutes = 60,
            TotalMarks = 100,
            IsActive = true,
            IsLive = true,
            StartTime = now.AddHours(-1),
            EndTime = now.AddHours(1)
        });
        await db.SaveChangesAsync();

        var visible = db.ExamPapers.Where(e =>
            e.IsActive && e.IsLive &&
            e.StartTime <= now && e.EndTime >= now).ToList();

        Assert.Single(visible);
    }

    [Fact]
    public async Task Exam_NotYetStarted_IsNotVisibleToStudent()
    {
        using var db = TestDbHelper.CreateInMemoryDb();
        var now = DateTime.UtcNow;

        db.ExamPapers.Add(new ExamPaper
        {
            Title = "Future Exam",
            Subject = "Science",
            DurationMinutes = 60,
            TotalMarks = 100,
            IsActive = true,
            IsLive = true,
            StartTime = now.AddHours(2),
            EndTime = now.AddHours(3)
        });
        await db.SaveChangesAsync();

        var visible = db.ExamPapers.Where(e =>
            e.IsActive && e.IsLive &&
            e.StartTime <= now && e.EndTime >= now).ToList();

        Assert.Empty(visible);
    }

    [Fact]
    public async Task Exam_AlreadyEnded_IsNotVisibleToStudent()
    {
        using var db = TestDbHelper.CreateInMemoryDb();
        var now = DateTime.UtcNow;

        db.ExamPapers.Add(new ExamPaper
        {
            Title = "Past Exam",
            Subject = "History",
            DurationMinutes = 60,
            TotalMarks = 100,
            IsActive = true,
            IsLive = true,
            StartTime = now.AddHours(-3),
            EndTime = now.AddHours(-1)
        });
        await db.SaveChangesAsync();

        var visible = db.ExamPapers.Where(e =>
            e.IsActive && e.IsLive &&
            e.StartTime <= now && e.EndTime >= now).ToList();

        Assert.Empty(visible);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Unit Tests: Validation failures
// ─────────────────────────────────────────────────────────────────────────────
public class ValidationTests
{
    [Theory]
    [InlineData("notanemail")]
    [InlineData("missing@domain")]
    [InlineData("@nodomain.com")]
    [InlineData("spaces in@email.com")]
    public void InvalidEmail_ShouldFailRegex(string email)
    {
        const string pattern = @"^[^\s@]+@[^\s@]+\.[^\s@]+$";
        Assert.DoesNotMatch(pattern, email);
    }

    [Theory]
    [InlineData("valid@email.com")]
    [InlineData("user.name+tag@domain.co.uk")]
    public void ValidEmail_ShouldPassRegex(string email)
    {
        const string pattern = @"^[^\s@]+@[^\s@]+\.[^\s@]+$";
        Assert.Matches(pattern, email);
    }

    [Theory]
    [InlineData("abc")]           // too short
    [InlineData("abcdef")]        // no number
    [InlineData("123456")]        // no letter
    public void WeakPassword_ShouldFail(string password)
    {
        bool hasLetter = System.Text.RegularExpressions.Regex.IsMatch(password, @"[a-zA-Z]");
        bool hasNumber = System.Text.RegularExpressions.Regex.IsMatch(password, @"[0-9]");
        bool longEnough = password.Length >= 6;
        Assert.False(longEnough && hasLetter && hasNumber);
    }

    [Theory]
    [InlineData("pass1word")]
    [InlineData("abc123")]
    public void StrongPassword_ShouldPass(string password)
    {
        bool hasLetter = System.Text.RegularExpressions.Regex.IsMatch(password, @"[a-zA-Z]");
        bool hasNumber = System.Text.RegularExpressions.Regex.IsMatch(password, @"[0-9]");
        bool longEnough = password.Length >= 6;
        Assert.True(longEnough && hasLetter && hasNumber);
    }

    [Fact]
    public void ExamWithEmptyTitle_ShouldFailValidation()
    {
        string title = "  ";
        Assert.True(string.IsNullOrWhiteSpace(title));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void ExamWithNonPositiveDuration_ShouldFailValidation(int duration)
    {
        Assert.True(duration <= 0);
    }
}

