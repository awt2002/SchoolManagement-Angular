using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Subjects.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class SubjectService : ISubjectService
    {
        private readonly AppDbContext _context;

        public SubjectService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<SubjectDto>>> GetSubjectsAsync(Guid? classId)
        {
            var query = _context.Subjects.Include(s => s.GradeCategories).AsQueryable();
            if (classId.HasValue) query = query.Where(s => s.ClassId == classId.Value);

            var subjects = await query
                .Select(s => new SubjectDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    ClassId = s.ClassId,
                    GradeCategories = s.GradeCategories.Select(gc => new GradeCategoryDto
                    {
                        Id = gc.Id,
                        Name = gc.Name,
                        Weight = gc.Weight,
                        SubjectId = gc.SubjectId
                    }).ToList()
                })
                .ToListAsync();

            return Result<List<SubjectDto>>.Ok(subjects, "Subjects retrieved");
        }

        public async Task<Result<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto)
        {
            if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId))
                return Result<SubjectDto>.NotFound("Class not found");

            var subject = new Subject
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                ClassId = dto.ClassId
            };
            _context.Subjects.Add(subject);
            await _context.SaveChangesAsync();

            return Result<SubjectDto>.Created(new SubjectDto
            {
                Id = subject.Id,
                Name = subject.Name,
                ClassId = subject.ClassId,
                GradeCategories = new List<GradeCategoryDto>()
            });
        }

        public async Task<Result<SubjectDto>> GetSubjectByIdAsync(Guid id)
        {
            var subject = await _context.Subjects
                .Include(s => s.GradeCategories)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (subject == null) return Result<SubjectDto>.NotFound("Subject not found");

            return Result<SubjectDto>.Ok(MapDto(subject), "Subject retrieved");
        }

        public async Task<Result<SubjectDto>> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return Result<SubjectDto>.NotFound("Subject not found");

            subject.Name = dto.Name;
            await _context.SaveChangesAsync();
            return await GetSubjectByIdAsync(id);
        }

        public async Task<Result<Unit>> DeleteSubjectAsync(Guid id)
        {
            var subject = await _context.Subjects.FindAsync(id);
            if (subject == null) return Result<Unit>.NotFound("Subject not found");

            var hasGrades = await _context.Grades.AnyAsync(g => g.GradeCategory.SubjectId == id);
            var hasExams = await _context.Exams.AnyAsync(e => e.SubjectId == id);
            if (hasGrades || hasExams)
                return Result<Unit>.Conflict(
                    "Cannot delete subject with existing grades or exams.",
                    "Cannot delete subject with existing grades or exams.");

            _context.Subjects.Remove(subject);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Subject deleted");
        }

        public async Task<Result<List<GradeCategoryDto>>> GetCategoriesAsync(Guid subjectId)
        {
            var categories = await _context.GradeCategories
                .Where(gc => gc.SubjectId == subjectId)
                .Select(gc => new GradeCategoryDto
                {
                    Id = gc.Id,
                    Name = gc.Name,
                    Weight = gc.Weight,
                    SubjectId = gc.SubjectId
                })
                .ToListAsync();
            return Result<List<GradeCategoryDto>>.Ok(categories, "Categories retrieved");
        }

        public async Task<Result<GradeCategoryDto>> CreateCategoryAsync(Guid subjectId, CreateGradeCategoryDto dto)
        {
            var subject = await _context.Subjects
                .Include(s => s.GradeCategories)
                .FirstOrDefaultAsync(s => s.Id == subjectId);
            if (subject == null) return Result<GradeCategoryDto>.NotFound("Subject not found");

            GradeCategory category;
            try
            {
                category = subject.AddCategory(dto.Name, dto.Weight);
            }
            catch (InvalidOperationException ex)
            {
                return Result<GradeCategoryDto>.Validation(ex.Message, ex.Message);
            }
            catch (ArgumentException ex)
            {
                return Result<GradeCategoryDto>.Validation(ex.Message, ex.Message);
            }

            _context.GradeCategories.Add(category);
            await _context.SaveChangesAsync();

            return Result<GradeCategoryDto>.Created(new GradeCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Weight = category.Weight,
                SubjectId = category.SubjectId
            });
        }

        public async Task<Result<GradeCategoryDto>> UpdateCategoryAsync(
            Guid subjectId, Guid categoryId, UpdateGradeCategoryDto dto)
        {
            var subject = await _context.Subjects
                .Include(s => s.GradeCategories)
                .FirstOrDefaultAsync(s => s.Id == subjectId);
            if (subject == null) return Result<GradeCategoryDto>.NotFound("Subject not found");
            if (!subject.GradeCategories.Any(c => c.Id == categoryId))
                return Result<GradeCategoryDto>.NotFound("Category not found");

            try
            {
                subject.UpdateCategoryWeight(categoryId, dto.Name, dto.Weight);
            }
            catch (InvalidOperationException ex)
            {
                return Result<GradeCategoryDto>.Validation(ex.Message, ex.Message);
            }

            await _context.SaveChangesAsync();

            var category = subject.GradeCategories.First(c => c.Id == categoryId);
            return Result<GradeCategoryDto>.Ok(new GradeCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Weight = category.Weight,
                SubjectId = category.SubjectId
            }, "Category updated");
        }

        public async Task<Result<Unit>> DeleteCategoryAsync(Guid subjectId, Guid categoryId)
        {
            var category = await _context.GradeCategories
                .FirstOrDefaultAsync(gc => gc.Id == categoryId && gc.SubjectId == subjectId);
            if (category == null) return Result<Unit>.NotFound("Category not found");

            var hasGrades = await _context.Grades.AnyAsync(g => g.GradeCategoryId == categoryId);
            if (hasGrades)
                return Result<Unit>.Conflict(
                    "Cannot delete category with existing grades.",
                    "Cannot delete category with existing grades.");

            _context.GradeCategories.Remove(category);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Category deleted");
        }

        private static SubjectDto MapDto(Subject subject) => new()
        {
            Id = subject.Id,
            Name = subject.Name,
            ClassId = subject.ClassId,
            GradeCategories = subject.GradeCategories.Select(gc => new GradeCategoryDto
            {
                Id = gc.Id,
                Name = gc.Name,
                Weight = gc.Weight,
                SubjectId = gc.SubjectId
            }).ToList()
        };
    }
}
