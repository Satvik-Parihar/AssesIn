namespace OnlineExamAPI.Models;

public class StudentAttempt
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int ExamPaperId { get; set; }
    public int? QuestionSetId { get; set; }
    public int Score { get; set; }
    public int TotalMarks { get; set; }
    public int CorrectCount { get; set; }
    public int IncorrectCount { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
    public bool IsCompleted { get; set; } = false;

    public User User { get; set; } = null!;
    public ExamPaper ExamPaper { get; set; } = null!;
    public QuestionSet? QuestionSet { get; set; }
    public ICollection<StudentAnswer> Answers { get; set; } = new List<StudentAnswer>();
}
