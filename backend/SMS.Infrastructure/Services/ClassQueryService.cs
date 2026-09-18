using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Classes.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Enums;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class ClassQueryService : IClassQueryService
    {
        private readonly AppDbContext _context;

        public ClassQueryService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<ClassDto>>> GetAllAsync(Guid? academicYearId, Guid? teacherId)
        {
            var query = _context.Classes
                .Include(c => c.Teacher)
                .Include(c => c.AcademicYear)
                .Include(c => c.Enrollments)
                .AsQueryable();

            if (academicYearId.HasValue) query = query.Where(c => c.AcademicYearId == academicYearId.Value);
            if (teacherId.HasValue) query = query.Where(c => c.Teacher != null && c.Teacher.Id == teacherId.Value);

            var classes = await query
                .OrderBy(c => c.GradeLevel)
                .ThenBy(c => c.Name)
                .Select(c => new ClassDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    GradeLevel = c.GradeLevel,
                    TeacherName = c.Teacher != null ? c.Teacher.FullName : null,
                    TeacherId = c.Teacher != null ? c.Teacher.Id : (Guid?)null,
                    StudentCount = c.Enrollments.Count(e => e.Student.User.Role == UserRole.Student),
                    AcademicYearId = c.AcademicYearId,
                    AcademicYearName = c.AcademicYear.Name
                })
                .ToListAsync();

            return Result<List<ClassDto>>.Ok(classes, "Classes retrieved");
        }

        public async Task<Result<ClassDetailDto>> GetByIdAsync(Guid id)
        {
            var classEntity = await _context.Classes
                .Include(c => c.Teacher)
                .Include(c => c.AcademicYear)
                .Include(c => c.Enrollments)
                    .ThenInclude(e => e.Student)
                        .ThenInclude(s => s.User)
                .Include(c => c.Subjects)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (classEntity == null)
            {
                return Result<ClassDetailDto>.NotFound("Class not found");
            }

            var dto = new ClassDetailDto
            {
                Id = classEntity.Id,
                Name = classEntity.Name,
                GradeLevel = classEntity.GradeLevel,
                TeacherName = classEntity.Teacher?.FullName,
                TeacherId = classEntity.Teacher?.Id,
                StudentCount = classEntity.Enrollments.Count(e => e.Student.User.Role == UserRole.Student),
                AcademicYearId = classEntity.AcademicYearId,
                AcademicYearName = classEntity.AcademicYear.Name,
                Students = classEntity.Enrollments
                    .Where(e => e.Student.User.Role == UserRole.Student)
                    .Select(e => new ClassStudentDto { Id = e.Student.Id, FullName = e.Student.FullName })
                    .ToList(),
                Subjects = classEntity.Subjects
                    .Select(s => new ClassSubjectDto { Id = s.Id, Name = s.Name })
                    .ToList()
            };

            return Result<ClassDetailDto>.Ok(dto, "Class retrieved");
        }
    }
}
