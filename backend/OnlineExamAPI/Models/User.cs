namespace OnlineExamAPI.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Student"; // Admin | Student
    public string InstituteName { get; set; } = string.Empty;
    public int? CreatedByAdminId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? CreatedByAdmin { get; set; }
    public ICollection<User> CreatedStudents { get; set; } = new List<User>();
    public ICollection<ExamPaper> CreatedExams { get; set; } = new List<ExamPaper>();
    public ICollection<StudentAttempt> Attempts { get; set; } = new List<StudentAttempt>();
}
