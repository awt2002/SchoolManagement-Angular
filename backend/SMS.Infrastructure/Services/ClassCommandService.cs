using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Classes.DTOs;
using SMS.Application.Features.Students.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class ClassCommandService : IClassCommandService
    {
        private readonly AppDbContext _context;

        public ClassCommandService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<ClassDto>> CreateAsync(CreateClassDto dto)
        {
            var academicYear = await _context.AcademicYears.FindAsync(dto.AcademicYearId);
            if (academicYear == null) return Result<ClassDto>.NotFound("Academic year not found");

            Teacher? teacher = null;
            if (dto.TeacherId.HasValue)
            {
                teacher = await _context.Teachers.FindAsync(dto.TeacherId.Value);
                if (teacher == null) return Result<ClassDto>.NotFound("Teacher not found");

                if (teacher.ClassId != null)
                {
                    return Result<ClassDto>.Conflict(
                        "This teacher is already assigned to another class. Please unassign them first.");
                }
            }

            var newClass = new Class
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                GradeLevel = dto.GradeLevel,
                AcademicYearId = dto.AcademicYearId
            };
            _context.Classes.Add(newClass);

            if (teacher != null) teacher.ClassId = newClass.Id;

            await _context.SaveChangesAsync();

            return Result<ClassDto>.Created(new ClassDto
            {
                Id = newClass.Id,
                Name = newClass.Name,
                GradeLevel = newClass.GradeLevel,
                TeacherId = teacher?.Id,
                TeacherName = teacher?.FullName,
                StudentCount = 0,
                AcademicYearId = newClass.AcademicYearId,
                AcademicYearName = academicYear.Name
            });
        }

        public async Task<Result<ClassDto>> UpdateAsync(Guid id, UpdateClassDto dto)
        {
            var classEntity = await _context.Classes
                .Include(c => c.Teacher)
                .Include(c => c.AcademicYear)
                .Include(c => c.Enrollments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (classEntity == null) return Result<ClassDto>.NotFound("Class not found");

            var academicYear = await _context.AcademicYears.FindAsync(dto.AcademicYearId);
            if (academicYear == null) return Result<ClassDto>.NotFound("Academic year not found");

            var currentTeacher = classEntity.Teacher;

            Teacher? newTeacher = null;
            if (dto.TeacherId.HasValue)
            {
                newTeacher = await _context.Teachers.FindAsync(dto.TeacherId.Value);
                if (newTeacher == null) return Result<ClassDto>.NotFound("Teacher not found");

                if (newTeacher.ClassId != null && newTeacher.ClassId != id)
                {
                    return Result<ClassDto>.Conflict(
                        "This teacher is already assigned to another class. Please unassign them first.");
                }
            }

            try
            {
                classEntity.ChangeAcademicYear(dto.AcademicYearId);
            }
            catch (InvalidOperationException ex)
            {
                return Result<ClassDto>.Conflict(ex.Message);
            }

            if (currentTeacher != null && currentTeacher.Id != newTeacher?.Id)
            {
                currentTeacher.ClassId = null;
            }

            if (newTeacher != null) newTeacher.ClassId = classEntity.Id;

            classEntity.Name = dto.Name;
            classEntity.GradeLevel = dto.GradeLevel;

            await _context.SaveChangesAsync();

            var studentCount = await _context.Enrollments.CountAsync(e => e.ClassId == id);

            return Result<ClassDto>.Ok(new ClassDto
            {
                Id = classEntity.Id,
                Name = classEntity.Name,
                GradeLevel = classEntity.GradeLevel,
                TeacherId = newTeacher?.Id,
                TeacherName = newTeacher?.FullName,
                StudentCount = studentCount,
                AcademicYearId = classEntity.AcademicYearId,
                AcademicYearName = academicYear.Name
            }, "Class updated");
        }

        public async Task<Result<Unit>> DeleteAsync(Guid id)
        {
            var classEntity = await _context.Classes
                .Include(c => c.Enrollments)
                .Include(c => c.Teacher)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (classEntity == null) return Result<Unit>.NotFound("Class not found");

            if (classEntity.Enrollments.Count > 0)
            {
                return Result<Unit>.Conflict(
                    "Cannot delete class with enrolled students",
                    "Remove enrolled students before deleting this class.");
            }

            if (classEntity.Teacher != null) classEntity.Teacher.ClassId = null;

            _context.Classes.Remove(classEntity);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Class deleted");
        }

        public async Task<Result<EnrollmentDto>> EnrollStudentAsync(Guid classId, EnrollStudentDto dto)
        {
            var classEntity = await _context.Classes
                .Include(c => c.AcademicYear)
                .FirstOrDefaultAsync(c => c.Id == classId);

            if (classEntity == null) return Result<EnrollmentDto>.NotFound("Class not found");

            if (!await _context.Students.AnyAsync(s => s.Id == dto.StudentId))
                return Result<EnrollmentDto>.NotFound("Student not found");

            var alreadyEnrolled = await _context.Enrollments
                .AnyAsync(e => e.StudentId == dto.StudentId && e.ClassId == classId);
            if (alreadyEnrolled)
            {
                return Result<EnrollmentDto>.Conflict("Student is already enrolled in this class");
            }

            var enrollment = new Enrollment
            {
                Id = Guid.NewGuid(),
                StudentId = dto.StudentId,
                ClassId = classId,
                AcademicYearId = classEntity.AcademicYearId,
                EnrolledAt = DateTime.UtcNow
            };
            _context.Enrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Result<EnrollmentDto>.Created(new EnrollmentDto
            {
                Id = enrollment.Id,
                ClassName = classEntity.Name,
                AcademicYearName = classEntity.AcademicYear.Name,
                EnrolledAt = enrollment.EnrolledAt
            }, "Student enrolled");
        }

        public async Task<Result<Unit>> RemoveStudentAsync(Guid classId, Guid studentId)
        {
            var enrollment = await _context.Enrollments
                .FirstOrDefaultAsync(e => e.ClassId == classId && e.StudentId == studentId);

            if (enrollment == null) return Result<Unit>.NotFound("Enrollment not found");

            _context.Enrollments.Remove(enrollment);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Student removed from class");
        }
    }
}
