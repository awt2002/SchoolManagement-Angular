using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SMS.Application.Common;
using SMS.Application.Features.Teachers.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Domain.Enums;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class TeacherService : ITeacherService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public TeacherService(AppDbContext context, IEmailService emailService, IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<Result<PagedList<TeacherDto>>> GetAllTeachersAsync(
            int page, int pageSize, string? search, bool includeInactive, bool inactiveOnly)
        {
            (page, pageSize) = Pagination.Normalize(page, pageSize);

            var query = _context.Teachers
                .Include(t => t.User)
                .Include(t => t.Class)
                .AsQueryable();

            if (inactiveOnly) query = query.Where(t => !t.User.IsActive);
            else if (!includeInactive) query = query.Where(t => t.User.IsActive);

            if (!string.IsNullOrEmpty(search)) query = query.Where(t => t.FullName.Contains(search));

            var totalCount = await query.CountAsync();
            var teachers = await query
                .OrderBy(t => t.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => MapDto(t))
                .ToListAsync();

            return Result<PagedList<TeacherDto>>.Ok(
                new PagedList<TeacherDto>(teachers, page, pageSize, totalCount),
                "Teachers retrieved");
        }

        public async Task<Result<TeacherDto>> GetTeacherByIdAsync(Guid id)
        {
            var teacher = await LoadAsync(t => t.Id == id);
            return teacher == null
                ? Result<TeacherDto>.NotFound("Teacher not found")
                : Result<TeacherDto>.Ok(MapDto(teacher), "Teacher retrieved");
        }

        public async Task<Result<TeacherDto>> GetTeacherByUserIdAsync(Guid userId)
        {
            var teacher = await LoadAsync(t => t.UserId == userId);
            return teacher == null
                ? Result<TeacherDto>.NotFound("Teacher not found")
                : Result<TeacherDto>.Ok(MapDto(teacher), "Teacher retrieved");
        }

        public async Task<Result<TeacherDto>> CreateTeacherAsync(CreateTeacherDto dto)
        {
            if (!MailAddress.TryCreate(dto.Email, out _))
                return Result<TeacherDto>.Validation("Please enter a valid email address.", "Please enter a valid email address.");

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return Result<TeacherDto>.Conflict("Username already exists");
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return Result<TeacherDto>.Conflict("Email already exists");

            if (dto.ClassId.HasValue)
            {
                if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value))
                    return Result<TeacherDto>.NotFound("Class not found");

                if (await _context.Teachers.AnyAsync(t => t.ClassId == dto.ClassId.Value))
                {
                    return Result<TeacherDto>.Conflict(
                        "This teacher is already assigned to another class. Please unassign them first.");
                }
            }

            var initialPassword = AuthService.GenerateRandomPassword();

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = dto.Username,
                PasswordHash = AuthService.HashPassword(initialPassword),
                Email = dto.Email,
                Role = UserRole.Teacher,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(user);

            var teacher = new Teacher
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                ClassId = dto.ClassId
            };
            _context.Teachers.Add(teacher);

            await _context.SaveChangesAsync();

            var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
            var loginLink = $"{frontendBaseUrl.TrimEnd('/')}/login";
            var emailSent = await _emailService.TrySendEmailAsync(
                dto.Email,
                "Welcome to SMS - Teacher Account",
                $"Welcome to the School Management System.\n\n" +
                $"Username: {dto.Username}\n" +
                $"Password: {initialPassword}\n\n" +
                $"Login here: {loginLink}\n\n" +
                "Please change your password after first login.");

            var reload = await LoadAsync(t => t.Id == teacher.Id);
            var message = emailSent ? "Teacher created" : "Teacher created (welcome email could not be sent)";
            return Result<TeacherDto>.Created(MapDto(reload!), message);
        }

        public async Task<Result<TeacherDto>> UpdateTeacherAsync(Guid id, UpdateTeacherDto dto)
        {
            var teacher = await LoadAsync(t => t.Id == id);
            if (teacher == null) return Result<TeacherDto>.NotFound("Teacher not found");

            if (await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != teacher.UserId))
                return Result<TeacherDto>.Conflict("Email already exists");

            if (dto.ClassId.HasValue && dto.ClassId != teacher.ClassId)
            {
                if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value))
                    return Result<TeacherDto>.NotFound("Class not found");

                var existingForClass = await _context.Teachers
                    .AnyAsync(t => t.ClassId == dto.ClassId.Value && t.Id != id);
                if (existingForClass)
                    return Result<TeacherDto>.Conflict(
                        "This teacher is already assigned to another class. Please unassign them first.");
            }

            teacher.FullName = dto.FullName;
            teacher.User.Email = dto.Email;
            teacher.PhoneNumber = dto.PhoneNumber;

            teacher.ClassId = dto.ClassId;

            await _context.SaveChangesAsync();
            var reload = await LoadAsync(t => t.Id == id);
            return Result<TeacherDto>.Ok(MapDto(reload!), "Teacher updated");
        }

        public async Task<Result<Unit>> DeleteTeacherAsync(Guid id)
        {
            var teacher = await LoadAsync(t => t.Id == id);
            if (teacher == null) return Result<Unit>.NotFound("Teacher not found");

            teacher.User.IsActive = false;

            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == teacher.UserId && rt.RevokedAt == null)
                .ToListAsync();
            foreach (var token in tokens) token.RevokedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Teacher deactivated");
        }

        public async Task<Result<Unit>> ReactivateTeacherAsync(Guid id)
        {
            var teacher = await LoadAsync(t => t.Id == id);
            if (teacher == null) return Result<Unit>.NotFound("Teacher not found");

            teacher.User.IsActive = true;
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Teacher reactivated");
        }

        private Task<Teacher?> LoadAsync(System.Linq.Expressions.Expression<Func<Teacher, bool>> predicate)
        {
            return _context.Teachers
                .Include(t => t.User)
                .Include(t => t.Class)
                .FirstOrDefaultAsync(predicate);
        }

        private static TeacherDto MapDto(Teacher teacher) => new()
        {
            Id = teacher.Id,
            UserId = teacher.UserId,
            FullName = teacher.FullName,
            Email = teacher.User.Email,
            PhoneNumber = teacher.PhoneNumber ?? string.Empty,
            Username = teacher.User.Username,
            IsActive = teacher.User.IsActive,
            AssignedClassName = teacher.Class?.Name,
            ClassId = teacher.ClassId
        };
    }
}
