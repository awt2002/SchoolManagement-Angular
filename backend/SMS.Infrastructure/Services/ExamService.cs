using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Exams.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class ExamService : IExamService
    {
        private readonly AppDbContext _context;

        public ExamService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<ExamDto>>> GetExamsAsync(
            Guid? subjectId, Guid? classId, DateOnly? from, DateOnly? to)
        {
            var query = _context.Exams.Include(e => e.Subject).AsQueryable();

            if (subjectId.HasValue) query = query.Where(e => e.SubjectId == subjectId.Value);
            if (classId.HasValue) query = query.Where(e => e.Subject.ClassId == classId.Value);
            if (from.HasValue) query = query.Where(e => e.ExamDate >= from.Value);
            if (to.HasValue) query = query.Where(e => e.ExamDate <= to.Value);

            var exams = await query
                .OrderByDescending(e => e.ExamDate)
                .Select(e => new ExamDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    SubjectId = e.SubjectId,
                    SubjectName = e.Subject.Name,
                    ExamDate = e.ExamDate,
                    MaxScore = e.MaxScore,
                    PassingThreshold = e.PassingThreshold
                })
                .ToListAsync();
            return Result<List<ExamDto>>.Ok(exams, "Exams retrieved");
        }

        public async Task<Result<ExamDto>> CreateExamAsync(CreateExamDto dto, Guid createdByUserId)
        {
            var subject = await _context.Subjects.FindAsync(dto.SubjectId);
            if (subject == null) return Result<ExamDto>.NotFound("Subject not found");

            if (dto.MaxScore <= 0)
                return Result<ExamDto>.Validation("Max score must be greater than zero.",
                    "Max score must be greater than zero.");

            if (dto.PassingThreshold < 0 || dto.PassingThreshold > 100)
                return Result<ExamDto>.Validation("Passing threshold must be between 0 and 100.",
                    "Passing threshold must be between 0 and 100.");

            var exam = new Exam
            {
                Id = Guid.NewGuid(),
                SubjectId = dto.SubjectId,
                Name = dto.Name,
                ExamDate = dto.ExamDate,
                MaxScore = dto.MaxScore,
                PassingThreshold = dto.PassingThreshold,
                CreatedBy = createdByUserId
            };
            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            return Result<ExamDto>.Created(new ExamDto
            {
                Id = exam.Id,
                Name = exam.Name,
                SubjectId = exam.SubjectId,
                SubjectName = subject.Name,
                ExamDate = exam.ExamDate,
                MaxScore = exam.MaxScore,
                PassingThreshold = exam.PassingThreshold
            });
        }

        public async Task<Result<ExamDto>> GetExamByIdAsync(Guid id)
        {
            var exam = await _context.Exams
                .Include(e => e.Subject)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (exam == null) return Result<ExamDto>.NotFound("Exam not found");

            return Result<ExamDto>.Ok(new ExamDto
            {
                Id = exam.Id,
                Name = exam.Name,
                SubjectId = exam.SubjectId,
                SubjectName = exam.Subject.Name,
                ExamDate = exam.ExamDate,
                MaxScore = exam.MaxScore,
                PassingThreshold = exam.PassingThreshold
            }, "Exam retrieved");
        }

        public async Task<Result<ExamDto>> UpdateExamAsync(Guid id, UpdateExamDto dto)
        {
            var exam = await _context.Exams
                .Include(e => e.Subject)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (exam == null) return Result<ExamDto>.NotFound("Exam not found");

            if (dto.MaxScore <= 0)
                return Result<ExamDto>.Validation("Max score must be greater than zero.",
                    "Max score must be greater than zero.");

            if (dto.PassingThreshold < 0 || dto.PassingThreshold > 100)
                return Result<ExamDto>.Validation("Passing threshold must be between 0 and 100.",
                    "Passing threshold must be between 0 and 100.");

            var highestRecorded = await _context.ExamResults
                .Where(er => er.ExamId == id)
                .Select(er => (decimal?)er.Score)
                .MaxAsync();

            if (highestRecorded.HasValue && dto.MaxScore < highestRecorded.Value)
            {
                return Result<ExamDto>.Conflict(
                    $"Max score cannot be lowered below the highest recorded score ({highestRecorded.Value}).");
            }

            exam.Name = dto.Name;
            exam.ExamDate = dto.ExamDate;
            exam.MaxScore = dto.MaxScore;
            exam.PassingThreshold = dto.PassingThreshold;
            await _context.SaveChangesAsync();

            return Result<ExamDto>.Ok(new ExamDto
            {
                Id = exam.Id,
                Name = exam.Name,
                SubjectId = exam.SubjectId,
                SubjectName = exam.Subject.Name,
                ExamDate = exam.ExamDate,
                MaxScore = exam.MaxScore,
                PassingThreshold = exam.PassingThreshold
            }, "Exam updated");
        }

        public async Task<Result<List<ExamResultDto>>> GetExamResultsAsync(Guid examId)
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null) return Result<List<ExamResultDto>>.NotFound("Exam not found");

            var results = await _context.ExamResults
                .Include(er => er.Student)
                .Where(er => er.ExamId == examId)
                .Select(er => new ExamResultDto
                {
                    Id = er.Id,
                    StudentId = er.StudentId,
                    StudentName = er.Student.FullName,
                    Score = er.Score,
                    Percentage = exam.MaxScore > 0 ? Math.Round(er.Score / exam.MaxScore * 100, 2) : 0,
                    Passed = exam.MaxScore > 0 && (er.Score / exam.MaxScore * 100) >= exam.PassingThreshold
                })
                .ToListAsync();

            return Result<List<ExamResultDto>>.Ok(results, "Exam results retrieved");
        }

        public async Task<Result<List<ExamResultDto>>> CreateExamResultsAsync(
            Guid examId, BulkExamResultDto dto, Guid enteredByUserId)
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null) return Result<List<ExamResultDto>>.NotFound("Exam not found");

            foreach (var entry in dto.Results)
            {
                if (entry.Score < 0 || entry.Score > exam.MaxScore)
                {
                    return Result<List<ExamResultDto>>.Validation(
                        "Validation failed",
                        $"Score must be between 0 and {exam.MaxScore}.");
                }
            }

            var submittedStudentIds = dto.Results.Select(r => r.StudentId).Distinct().ToList();
            var knownStudentIds = await _context.Students
                .Where(s => submittedStudentIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            if (knownStudentIds.Count != submittedStudentIds.Count)
            {
                var missing = submittedStudentIds.Except(knownStudentIds).ToList();
                return Result<List<ExamResultDto>>.NotFound(
                    $"Student not found: {string.Join(", ", missing)}");
            }

            foreach (var entry in dto.Results)
            {
                var existing = await _context.ExamResults
                    .FirstOrDefaultAsync(er => er.ExamId == examId && er.StudentId == entry.StudentId);

                if (existing != null)
                {
                    existing.Score = entry.Score;
                    existing.EnteredBy = enteredByUserId;
                    existing.EnteredAt = DateTime.UtcNow;
                }
                else
                {
                    _context.ExamResults.Add(new ExamResult
                    {
                        Id = Guid.NewGuid(),
                        ExamId = examId,
                        StudentId = entry.StudentId,
                        Score = entry.Score,
                        EnteredBy = enteredByUserId,
                        EnteredAt = DateTime.UtcNow
                    });
                }
            }

            await _context.SaveChangesAsync();
            return await GetExamResultsAsync(examId);
        }

        public async Task<Result<Unit>> DeleteExamAsync(Guid id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return Result<Unit>.NotFound("Exam not found");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Exam deleted");
        }

        public async Task<Result<ExamResultDetailDto>> GetStudentExamResultAsync(Guid examId, Guid studentId)
        {
            var exam = await _context.Exams.FindAsync(examId);
            if (exam == null) return Result<ExamResultDetailDto>.NotFound("Exam not found");

            var result = await _context.ExamResults
                .FirstOrDefaultAsync(er => er.ExamId == examId && er.StudentId == studentId);
            if (result == null) return Result<ExamResultDetailDto>.NotFound("Exam result not found");

            var scores = await _context.ExamResults
                .Where(er => er.ExamId == examId)
                .Select(er => er.Score)
                .ToListAsync();

            var percentage = exam.MaxScore > 0 ? Math.Round(result.Score / exam.MaxScore * 100, 2) : 0;
            var passed = exam.MaxScore > 0 && percentage >= exam.PassingThreshold;

            return Result<ExamResultDetailDto>.Ok(new ExamResultDetailDto
            {
                Score = result.Score,
                Percentage = percentage,
                Passed = passed,
                Average = scores.Count > 0 ? Math.Round(scores.Average(), 2) : 0,
                Highest = scores.Count > 0 ? scores.Max() : 0,
                Lowest = scores.Count > 0 ? scores.Min() : 0
            }, "Exam result retrieved");
        }
    }
}
