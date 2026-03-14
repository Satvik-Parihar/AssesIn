namespace OnlineExamAPI.Models;

public class QuestionSet
{
    public int Id { get; set; }
    public int ExamPaperId { get; set; }
    public string SetName { get; set; } = string.Empty; // Set A, Set B, etc.

    public ExamPaper ExamPaper { get; set; } = null!;
    public ICollection<QuestionSetItem> Items { get; set; } = new List<QuestionSetItem>();
}
