using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Grades.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class GradeService : IGradeService
    {
        private readonly AppDbContext _context;

        public GradeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<GradeDto>>> GetGradesAsync(
            Guid? subjectId, Guid? studentId, Guid? academicYearId)
        {
            var query = _context.Grades
                .Include(g => g.Student)
                .Include(g => g.GradeCategory).ThenInclude(gc => gc.Subject)
                .AsQueryable();

            if (studentId.HasValue) query = query.Where(g => g.StudentId == studentId.Value);
            if (subjectId.HasValue) query = query.Where(g => g.GradeCategory.SubjectId == subjectId.Value);
            if (academicYearId.HasValue)
                query = query.Where(g => g.GradeCategory.Subject.Class.AcademicYearId == academicYearId.Value);

            var grades = await query
                .OrderBy(g => g.GradeCategory.Subject.Name)
                .ThenBy(g => g.GradeCategory.Name)
                .Select(g => new GradeDto
                {
                    Id = g.Id,
                    StudentId = g.StudentId,
                    StudentName = g.Student.FullName,
                    GradeCategoryId = g.GradeCategoryId,
                    SubjectName = g.GradeCategory.Subject.Name,
                    CategoryName = g.GradeCategory.Name,
                    Score = g.Score,
                    WeightedContribution = g.Score * g.GradeCategory.Weight / 100m
                })
                .ToListAsync();

            return Result<List<GradeDto>>.Ok(grades, "Grades retrieved");
        }

        public async Task<Result<GradeDto>> CreateOrUpdateGradeAsync(
            CreateGradeDto dto, Guid enteredByUserId)
        {
            var existing = await _context.Grades
                .FirstOrDefaultAsync(g => g.StudentId == dto.StudentId
                    && g.GradeCategoryId == dto.GradeCategoryId);

            if (existing != null)
            {
                var auditLog = new GradeAuditLog
                {
                    Id = Guid.NewGuid(),
                    GradeId = existing.Id,
                    OldScore = existing.Score,
                    NewScore = dto.Score,
                    ChangedBy = enteredByUserId,
                    ChangedAt = DateTime.UtcNow
                };

                try
                {
                    existing.UpdateScore(dto.Score, enteredByUserId);
                }
                catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
                {
                    return Result<GradeDto>.Validation(ex.Message, ex.Message);
                }

                _context.GradeAuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
                return Result<GradeDto>.Ok(await BuildGradeDtoAsync(existing.Id), "Grade updated");
            }

            var student = await _context.Students
                .Include(s => s.Grades)
                .FirstOrDefaultAsync(s => s.Id == dto.StudentId);
            if (student == null) return Result<GradeDto>.NotFound("Student not found");

            if (!await _context.GradeCategories.AnyAsync(gc => gc.Id == dto.GradeCategoryId))
                return Result<GradeDto>.NotFound("Grade category not found");

            Grade grade;
            try
            {
                grade = student.AssignGrade(dto.GradeCategoryId, dto.Score, enteredByUserId);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                return Result<GradeDto>.Validation(ex.Message, ex.Message);
            }

            _context.Grades.Add(grade);
            await _context.SaveChangesAsync();
            return Result<GradeDto>.Created(await BuildGradeDtoAsync(grade.Id));
        }

        private async Task<GradeDto> BuildGradeDtoAsync(Guid gradeId)
        {
            var grade = await _context.Grades
                .Include(g => g.Student)
                .Include(g => g.GradeCategory).ThenInclude(gc => gc.Subject)
                .FirstAsync(g => g.Id == gradeId);

            return new GradeDto
            {
                Id = grade.Id,
                StudentId = grade.StudentId,
                StudentName = grade.Student.FullName,
                GradeCategoryId = grade.GradeCategoryId,
                SubjectName = grade.GradeCategory.Subject.Name,
                CategoryName = grade.GradeCategory.Name,
                Score = grade.Score,
                WeightedContribution = grade.Score * grade.GradeCategory.Weight / 100m
            };
        }

        internal static decimal WeightedAverageOf(IEnumerable<Grade> grades)
        {
            decimal weightedTotal = 0m;
            decimal totalWeight = 0m;

            foreach (var grade in grades)
            {
                weightedTotal += grade.Score * grade.GradeCategory.Weight;
                totalWeight += grade.GradeCategory.Weight;
            }

            return totalWeight > 0m ? Math.Round(weightedTotal / totalWeight, 2) : 0m;
        }

        public async Task<Result<GradeSummaryDto>> GetGradeSummaryAsync(
            Guid? studentId, Guid? classId, Guid? academicYearId)
        {
            var query = _context.Grades
                .Include(g => g.GradeCategory).ThenInclude(gc => gc.Subject).ThenInclude(s => s.Class)
                .AsQueryable();

            if (studentId.HasValue) query = query.Where(g => g.StudentId == studentId.Value);
            if (classId.HasValue) query = query.Where(g => g.GradeCategory.Subject.ClassId == classId.Value);
            if (academicYearId.HasValue)
                query = query.Where(g => g.GradeCategory.Subject.Class.AcademicYearId == academicYearId.Value);

            var grades = await query.ToListAsync();

            var subjectGroups = grades
                .GroupBy(g => new { g.GradeCategory.SubjectId, g.GradeCategory.Subject.Name })
                .Select(group => new SubjectAverageDto
                {
                    SubjectId = group.Key.SubjectId,
                    SubjectName = group.Key.Name,
                    WeightedAverage = WeightedAverageOf(group)
                })
                .OrderBy(s => s.SubjectName)
                .ToList();

            var gpa = subjectGroups.Count > 0
                ? Math.Round(subjectGroups.Average(s => s.WeightedAverage), 2)
                : 0m;

            return Result<GradeSummaryDto>.Ok(new GradeSummaryDto
            {
                SubjectAverages = subjectGroups,
                Gpa = gpa
            }, "Grade summary retrieved");
        }

        public async Task<Result<PagedList<GradeAuditLogDto>>> GetAuditLogAsync(
            Guid? studentId, Guid? subjectId, DateOnly? from, DateOnly? to, int page, int pageSize)
        {
            (page, pageSize) = Pagination.Normalize(page, pageSize);

            var query = _context.GradeAuditLogs
                .Include(a => a.Grade).ThenInclude(g => g.Student)
                .Include(a => a.Grade).ThenInclude(g => g.GradeCategory).ThenInclude(gc => gc.Subject)
                .Include(a => a.ChangedByUser)
                .AsQueryable();

            if (studentId.HasValue) query = query.Where(a => a.Grade.StudentId == studentId.Value);
            if (subjectId.HasValue) query = query.Where(a => a.Grade.GradeCategory.SubjectId == subjectId.Value);
            if (from.HasValue)
            {
                var fromDate = from.Value.ToDateTime(TimeOnly.MinValue);
                query = query.Where(a => a.ChangedAt >= fromDate);
            }
            if (to.HasValue)
            {
                var toDate = to.Value.ToDateTime(TimeOnly.MaxValue);
                query = query.Where(a => a.ChangedAt <= toDate);
            }

            var totalCount = await query.CountAsync();
            var logs = await query
                .OrderByDescending(a => a.ChangedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new GradeAuditLogDto
                {
                    Id = a.Id,
                    StudentName = a.Grade.Student.FullName,
                    SubjectName = a.Grade.GradeCategory.Subject.Name,
                    CategoryName = a.Grade.GradeCategory.Name,
                    OldScore = a.OldScore,
                    NewScore = a.NewScore,
                    ChangedBy = a.ChangedByUser.Username,
                    ChangedAt = a.ChangedAt
                })
                .ToListAsync();

            return Result<PagedList<GradeAuditLogDto>>.Ok(
                new PagedList<GradeAuditLogDto>(logs, page, pageSize, totalCount),
                "Audit log retrieved");
        }
    }
}
