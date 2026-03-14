namespace OnlineExamAPI.Models;

public class ExamPaper
{
    public int Id { get; set; }
    public int CreatedByAdminId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public int DurationMinutes { get; set; }
    public int TotalMarks { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsLive { get; set; } = false;
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }

    public User CreatedByAdmin { get; set; } = null!;
    public ICollection<Question> Questions { get; set; } = new List<Question>();
    public ICollection<QuestionSet> QuestionSets { get; set; } = new List<QuestionSet>();
    public ICollection<StudentAttempt> Attempts { get; set; } = new List<StudentAttempt>();
}
