namespace OnlineExamAPI.Models;

public class StudentAnswer
{
    public int Id { get; set; }
    public int AttemptId { get; set; }
    public int QuestionId { get; set; }
    public string? SelectedOption { get; set; } // A | B | C | D | null
    public bool IsCorrect { get; set; }

    public StudentAttempt Attempt { get; set; } = null!;
    public Question Question { get; set; } = null!;
}
