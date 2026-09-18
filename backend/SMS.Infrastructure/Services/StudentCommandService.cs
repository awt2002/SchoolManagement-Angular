using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SMS.Application.Common;
using SMS.Application.Features.Students.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Domain.Enums;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class StudentCommandService : IStudentCommandService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public StudentCommandService(AppDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<Result<StudentDetailDto>> CreateAsync(CreateStudentDto dto)
        {
            if (dto.ClassId.HasValue != dto.AcademicYearId.HasValue)
            {
                return Result<StudentDetailDto>.Validation(
                    "Class and academic year must both be provided when enrolling a student");
            }

            if (dto.ClassId.HasValue)
            {
                if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value))
                    return Result<StudentDetailDto>.NotFound("Class not found");

                if (!await _context.AcademicYears.AnyAsync(a => a.Id == dto.AcademicYearId!.Value))
                    return Result<StudentDetailDto>.NotFound("Academic year not found");
            }

            var username = await GenerateUniqueUsernameAsync(dto.FullName);
            var initialPassword = AuthService.GenerateRandomPassword();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = username,
                PasswordHash = AuthService.HashPassword(initialPassword),
                Email = $"{username}@school.com",
                Role = UserRole.Student,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            var student = new Student
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FullName = dto.FullName,
                DateOfBirth = dto.DateOfBirth,
                Address = dto.Address,
                EnrollmentYear = DateTime.UtcNow.Year
            };
            _context.Students.Add(student);

            _context.ParentContacts.Add(new ParentContact
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                FullName = dto.ParentName,
                Email = dto.ParentEmail,
                PhoneNumber = dto.ParentPhone
            });

            if (dto.ClassId.HasValue)
            {
                _context.Enrollments.Add(
                    student.EnrollStudent(dto.ClassId.Value, dto.AcademicYearId!.Value));
            }

            await _context.SaveChangesAsync();

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
            var loginLink = $"{frontendBaseUrl.TrimEnd('/')}/login";
            var recipientEmail = string.IsNullOrWhiteSpace(dto.ParentEmail) ? user.Email : dto.ParentEmail;

            var emailSent = await _emailService.TrySendEmailAsync(
                recipientEmail,
                "Welcome to SMS - Student Account",
                $"Welcome to the School Management System.\n\n" +
                $"Student Name: {dto.FullName}\n" +
                $"Username: {username}\n" +
                $"Password: {initialPassword}\n\n" +
                $"Login here: {loginLink}\n\n" +
                "Please change the password after first login.");

            var reload = await LoadForDetailAsync(student.Id);
            var message = emailSent ? "Student created" : "Student created (welcome email could not be sent)";
            return Result<StudentDetailDto>.Created(StudentQueryService.MapDetailDto(reload!), message);
        }

        public async Task<Result<StudentDetailDto>> UpdateAsync(Guid id, UpdateStudentDto dto)
        {
            var student = await _context.Students
                .Include(s => s.ParentContact)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (student == null) return Result<StudentDetailDto>.NotFound("Student not found");

            student.FullName = dto.FullName;
            student.DateOfBirth = dto.DateOfBirth;
            student.Address = dto.Address;

            if (student.ParentContact != null)
            {
                student.ParentContact.FullName = dto.ParentName;
                student.ParentContact.Email = dto.ParentEmail;
                student.ParentContact.PhoneNumber = dto.ParentPhone;
            }

            await _context.SaveChangesAsync();

            var reload = await LoadForDetailAsync(id);
            return reload is null
                ? Result<StudentDetailDto>.NotFound("Student not found after update")
                : Result<StudentDetailDto>.Ok(StudentQueryService.MapDetailDto(reload), "Student updated");
        }

        public async Task<Result<Unit>> DeleteAsync(Guid id)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return Result<Unit>.NotFound("Student not found");

            student.User.IsActive = false;

            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == student.UserId && rt.RevokedAt == null)
                .ToListAsync();
            foreach (var token in tokens) token.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Student deactivated");
        }

        public async Task<Result<Unit>> ReactivateAsync(Guid id)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (student == null) return Result<Unit>.NotFound("Student not found");

            student.User.IsActive = true;
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Student reactivated");
        }

        private async Task<Student?> LoadForDetailAsync(Guid id)
        {
            return await _context.Students
                .Include(s => s.User)
                .Include(s => s.ParentContact)
                .Include(s => s.Enrollments).ThenInclude(e => e.Class)
                .Include(s => s.Enrollments).ThenInclude(e => e.AcademicYear)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        private async Task<string> GenerateUniqueUsernameAsync(string fullName)
        {
            var username = fullName.Replace(" ", "").ToLower();
            var original = username;
            var counter = 1;

            while (await _context.Users.AnyAsync(u => u.Username == username))
            {
                username = original + counter++;
            }
            if (username.Length > 20)
            {
                username = username.Substring(0, 16) + Random.Shared.Next(1000, 9999);
            }
            return username;
        }
    }
}
