using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Students.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Enums;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class StudentQueryService : IStudentQueryService
    {
        private readonly AppDbContext _context;

        public StudentQueryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<PagedList<StudentSummaryDto>>> GetAllAsync(
            int page, int pageSize, string? search, int? gradeLevel,
            Guid? classId, Guid? academicYearId, bool includeInactive, bool inactiveOnly)
        {
            (page, pageSize) = Pagination.Normalize(page, pageSize);

            var query = _context.Students
                .Include(s => s.User)
                .Include(s => s.Enrollments).ThenInclude(e => e.Class)
                .AsQueryable();

            query = query.Where(s => s.User.Role == UserRole.Student);

            if (inactiveOnly)
                query = query.Where(s => !s.User.IsActive);
            else if (!includeInactive)
                query = query.Where(s => s.User.IsActive);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(s => s.FullName.Contains(search));
            if (gradeLevel.HasValue)
                query = query.Where(s => s.Enrollments.Any(e => e.Class.GradeLevel == gradeLevel.Value));
            if (classId.HasValue)
                query = query.Where(s => s.Enrollments.Any(e => e.ClassId == classId.Value));
            if (academicYearId.HasValue)
                query = query.Where(s => s.Enrollments.Any(e => e.AcademicYearId == academicYearId.Value));

            var totalCount = await query.CountAsync();

            var students = await query
                .OrderBy(s => s.FullName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new StudentSummaryDto
                {
                    Id = s.Id,
                    FullName = s.FullName,
                    DateOfBirth = s.DateOfBirth,
                    ClassName = s.Enrollments
                        .OrderByDescending(e => e.EnrolledAt)
                        .Select(e => e.Class.Name)
                        .FirstOrDefault() ?? "",
                    GradeLevel = s.Enrollments
                        .OrderByDescending(e => e.EnrolledAt)
                        .Select(e => e.Class.GradeLevel)
                        .FirstOrDefault(),
                    IsActive = s.User.IsActive
                })
                .ToListAsync();

            return Result<PagedList<StudentSummaryDto>>.Ok(
                new PagedList<StudentSummaryDto>(students, page, pageSize, totalCount),
                "Students retrieved");
        }

        public async Task<Result<StudentDetailDto>> GetByIdAsync(Guid id)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .Include(s => s.ParentContact)
                .Include(s => s.Enrollments).ThenInclude(e => e.Class)
                .Include(s => s.Enrollments).ThenInclude(e => e.AcademicYear)
                .FirstOrDefaultAsync(s => s.Id == id && s.User.Role == UserRole.Student);

            if (student == null) return Result<StudentDetailDto>.NotFound("Student not found");
            return Result<StudentDetailDto>.Ok(MapDetailDto(student), "Student retrieved");
        }

        public async Task<Result<StudentDetailDto>> GetByUserIdAsync(Guid userId)
        {
            var student = await _context.Students
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.User.Role == UserRole.Student);

            if (student == null) return Result<StudentDetailDto>.NotFound("Student not found");
            return await GetByIdAsync(student.Id);
        }

        public async Task<Result<List<EnrollmentDto>>> GetEnrollmentsAsync(Guid studentId)
        {
            var enrollments = await _context.Enrollments
                .Include(e => e.Class)
                .Include(e => e.AcademicYear)
                .Where(e => e.StudentId == studentId)
                .Select(e => new EnrollmentDto
                {
                    Id = e.Id,
                    ClassName = e.Class.Name,
                    AcademicYearName = e.AcademicYear.Name,
                    EnrolledAt = e.EnrolledAt
                })
                .ToListAsync();

            return Result<List<EnrollmentDto>>.Ok(enrollments, "Enrollments retrieved");
        }

        internal static StudentDetailDto MapDetailDto(Domain.Entities.Student student) => new()
        {
            Id = student.Id,
            UserId = student.UserId,
            Username = student.User.Username,
            FullName = student.FullName,
            DateOfBirth = student.DateOfBirth,
            Address = student.Address,
            EnrollmentYear = student.EnrollmentYear,
            IsActive = student.User.IsActive,
            CurrentClassId = student.Enrollments
                .OrderByDescending(e => e.EnrolledAt)
                .Select(e => (Guid?)e.ClassId)
                .FirstOrDefault(),
            ParentName = student.ParentContact?.FullName ?? "",
            ParentEmail = student.ParentContact?.Email ?? "",
            ParentPhone = student.ParentContact?.PhoneNumber ?? "",
            Enrollments = student.Enrollments.Select(e => new EnrollmentDto
            {
                Id = e.Id,
                ClassName = e.Class.Name,
                AcademicYearName = e.AcademicYear.Name,
                EnrolledAt = e.EnrolledAt
            }).ToList()
        };
    }
}
