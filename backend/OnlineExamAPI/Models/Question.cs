namespace OnlineExamAPI.Models;

public class Question
{
    public int Id { get; set; }
    public int ExamPaperId { get; set; }
    public string Text { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public string CorrectOption { get; set; } = string.Empty; // A | B | C | D
    public int Marks { get; set; } = 1;

    public ExamPaper ExamPaper { get; set; } = null!;
    public ICollection<QuestionSetItem> QuestionSetItems { get; set; } = new List<QuestionSetItem>();
    public ICollection<StudentAnswer> StudentAnswers { get; set; } = new List<StudentAnswer>();
}
