using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OnlineExamAPI.Data;
using OnlineExamAPI.DTOs;
using OnlineExamAPI.Models;
using OnlineExamAPI.Services;
using System.Text.RegularExpressions;

namespace OnlineExamAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly Regex EmailRegex =
        new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    private static readonly Regex PasswordLetterRegex =
        new(@"[a-zA-Z]", RegexOptions.Compiled);

    private static readonly Regex PasswordNumberRegex =
        new(@"[0-9]", RegexOptions.Compiled);

    private readonly AppDbContext _db;
    private readonly JwtService _jwtService;

    public AuthController(AppDbContext db, JwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    /// <summary>Public endpoint for registering a new admin account and institute.</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.InstituteName))
            return BadRequest(new { message = "All fields are required." });

        if (!EmailRegex.IsMatch(request.Email.Trim()))
            return BadRequest(new { message = "Invalid email format." });

        if (request.Password != request.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        if (request.Password.Length < 6 ||
            !PasswordLetterRegex.IsMatch(request.Password) ||
            !PasswordNumberRegex.IsMatch(request.Password))
            return BadRequest(new { message = "Password must be at least 6 characters and contain a letter and a number." });

        var normalizedEmail = request.Email.ToLower().Trim();
        var normalizedInstitute = request.InstituteName.Trim();

        var exists = await _db.Users.AnyAsync(u => u.Email == normalizedEmail);
        if (exists)
            return Conflict(new { message = "Email already registered." });

        var instituteExists = await _db.Users.AnyAsync(u =>
            u.Role == "Admin" &&
            u.InstituteName.ToLower() == normalizedInstitute.ToLower());
        if (instituteExists)
            return Conflict(new { message = "An admin account already exists for this institute." });

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Admin",
            InstituteName = normalizedInstitute,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Role, user.FullName, user.Id, user.InstituteName));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Email and password are required." });

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email.ToLower().Trim());
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        if (!user.IsActive)
            return Unauthorized(new { message = "Your account has been deactivated. Please contact your administrator." });

        var token = _jwtService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Role, user.FullName, user.Id, user.InstituteName));
    }
}
