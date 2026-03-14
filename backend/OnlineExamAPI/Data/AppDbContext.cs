using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Models;

namespace OnlineExamAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<ExamPaper> ExamPapers => Set<ExamPaper>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionSet> QuestionSets => Set<QuestionSet>();
    public DbSet<QuestionSetItem> QuestionSetItems => Set<QuestionSetItem>();
    public DbSet<StudentAttempt> StudentAttempts => Set<StudentAttempt>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasDefaultValue("Student");
            e.Property(u => u.IsActive).HasDefaultValue(true);

            // Self-referential: student -> admin who created them
            e.HasOne(u => u.CreatedByAdmin)
             .WithMany(u => u.CreatedStudents)
             .HasForeignKey(u => u.CreatedByAdminId)
             .OnDelete(DeleteBehavior.Restrict)
             .IsRequired(false);
        });

        modelBuilder.Entity<Question>()
            .HasOne(q => q.ExamPaper)
            .WithMany(ep => ep.Questions)
            .HasForeignKey(q => q.ExamPaperId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ExamPaper>()
            .HasOne(ep => ep.CreatedByAdmin)
            .WithMany(u => u.CreatedExams)
            .HasForeignKey(ep => ep.CreatedByAdminId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QuestionSet>()
            .HasOne(qs => qs.ExamPaper)
            .WithMany(ep => ep.QuestionSets)
            .HasForeignKey(qs => qs.ExamPaperId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestionSetItem>()
            .HasOne(qsi => qsi.QuestionSet)
            .WithMany(qs => qs.Items)
            .HasForeignKey(qsi => qsi.QuestionSetId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuestionSetItem>()
            .HasOne(qsi => qsi.Question)
            .WithMany(q => q.QuestionSetItems)
            .HasForeignKey(qsi => qsi.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<StudentAttempt>()
            .HasOne(sa => sa.User)
            .WithMany(u => u.Attempts)
            .HasForeignKey(sa => sa.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentAttempt>()
            .HasOne(sa => sa.ExamPaper)
            .WithMany(ep => ep.Attempts)
            .HasForeignKey(sa => sa.ExamPaperId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<StudentAttempt>()
            .HasOne(sa => sa.QuestionSet)
            .WithMany()
            .HasForeignKey(sa => sa.QuestionSetId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<StudentAnswer>()
            .HasOne(sa => sa.Attempt)
            .WithMany(a => a.Answers)
            .HasForeignKey(sa => sa.AttemptId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentAnswer>()
            .HasOne(sa => sa.Question)
            .WithMany(q => q.StudentAnswers)
            .HasForeignKey(sa => sa.QuestionId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
