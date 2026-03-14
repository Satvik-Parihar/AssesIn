using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Data;
using OnlineExamAPI.DTOs;
using OnlineExamAPI.Models;

namespace OnlineExamAPI.Controllers;

/// <summary>
/// Admin-only endpoints for managing student accounts.
/// Students cannot self-register; only admins can create/edit/deactivate them.
/// </summary>
[ApiController]
[Route("api/students")]
[Authorize(Roles = "Admin")]
public class StudentsController : ControllerBase
{
    private static readonly Regex EmailRegex =
        new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    private static readonly Regex PasswordLetterRegex =
        new(@"[a-zA-Z]", RegexOptions.Compiled);

    private static readonly Regex PasswordNumberRegex =
        new(@"[0-9]", RegexOptions.Compiled);

    private readonly AppDbContext _db;

    public StudentsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/students — list all students created by this admin
    [HttpGet]
    public async Task<IActionResult> GetStudents()
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var students = await _db.Users
            .Where(u => u.Role == "Student" && u.CreatedByAdminId == adminId)
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new StudentListDto(
                u.Id,
                u.FullName,
                u.Email,
                u.InstituteName,
                u.IsActive,
                u.CreatedAt
            ))
            .ToListAsync();

        return Ok(students);
    }

    // POST /api/students/create — create a new student
    [HttpPost("create")]
    public async Task<IActionResult> CreateStudent([FromBody] CreateStudentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.ConfirmPassword))
            return BadRequest(new { message = "All fields are required." });

        if (!EmailRegex.IsMatch(request.Email.Trim()))
            return BadRequest(new { message = "Invalid email format." });

        if (request.Password != request.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        if (request.Password.Length < 6 ||
            !PasswordLetterRegex.IsMatch(request.Password) ||
            !PasswordNumberRegex.IsMatch(request.Password))
            return BadRequest(new { message = "Password must be at least 6 characters and contain a letter and a number." });

        var exists = await _db.Users.AnyAsync(u => u.Email == request.Email.ToLower().Trim());
        if (exists)
            return Conflict(new { message = "Email is already registered." });

        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var admin = await _db.Users.FirstOrDefaultAsync(u => u.Id == adminId && u.Role == "Admin");
        if (admin is null)
            return Unauthorized(new { message = "Admin account not found." });

        if (string.IsNullOrWhiteSpace(admin.InstituteName))
            return BadRequest(new { message = "Admin institute is not configured." });

        var student = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Student",
            InstituteName = admin.InstituteName,
            CreatedByAdminId = adminId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(student);
        await _db.SaveChangesAsync();

        return Ok(new StudentListDto(
            student.Id, student.FullName, student.Email,
            student.InstituteName, student.IsActive, student.CreatedAt));
    }

    // PUT /api/students/{id} — edit student name or active status
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStudent(int id, [FromBody] UpdateStudentRequest request)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var student = await _db.Users.FirstOrDefaultAsync(
            u => u.Id == id && u.Role == "Student" && u.CreatedByAdminId == adminId);

        if (student is null)
            return NotFound(new { message = "Student not found." });

        if (string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "Full name is required." });

        student.FullName = request.FullName.Trim();
        student.IsActive = request.IsActive;

        await _db.SaveChangesAsync();

        return Ok(new StudentListDto(
            student.Id, student.FullName, student.Email,
            student.InstituteName, student.IsActive, student.CreatedAt));
    }

    // DELETE /api/students/{id} — deactivate (soft-delete)
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeactivateStudent(int id)
    {
        var adminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var student = await _db.Users.FirstOrDefaultAsync(
            u => u.Id == id && u.Role == "Student" && u.CreatedByAdminId == adminId);

        if (student is null)
            return NotFound(new { message = "Student not found." });

        student.IsActive = false;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Student deactivated successfully." });
    }
}
