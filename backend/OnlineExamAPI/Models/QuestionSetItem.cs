namespace OnlineExamAPI.Models;

public class QuestionSetItem
{
    public int Id { get; set; }
    public int QuestionSetId { get; set; }
    public int QuestionId { get; set; }
    public int DisplayOrder { get; set; }

    public QuestionSet QuestionSet { get; set; } = null!;
    public Question Question { get; set; } = null!;
}
