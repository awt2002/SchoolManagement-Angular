using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Attendance.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class AttendanceService : IAttendanceService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public AttendanceService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<Result<List<AttendanceRecordDto>>> GetAttendanceAsync(
            Guid? classId, Guid? studentId, DateOnly? from, DateOnly? to)
        {
            var query = _context.AttendanceRecords
                .Include(a => a.Student)
                .Include(a => a.Class)
                .Include(a => a.RecordedByUser)
                .AsQueryable();

            if (classId.HasValue) query = query.Where(a => a.ClassId == classId.Value);
            if (studentId.HasValue) query = query.Where(a => a.StudentId == studentId.Value);
            if (from.HasValue) query = query.Where(a => a.AbsenceDate >= from.Value);
            if (to.HasValue) query = query.Where(a => a.AbsenceDate <= to.Value);

            var records = await query
                .OrderByDescending(a => a.AbsenceDate)
                .Select(a => new AttendanceRecordDto
                {
                    Id = a.Id,
                    StudentId = a.StudentId,
                    StudentName = a.Student.FullName,
                    ClassId = a.ClassId,
                    ClassName = a.Class.Name,
                    AbsenceDate = a.AbsenceDate,
                    RecordedByName = a.RecordedByUser.Username,
                    RecordedAt = a.RecordedAt
                })
                .ToListAsync();

            return Result<List<AttendanceRecordDto>>.Ok(records, "Attendance records retrieved");
        }

        public async Task<Result<AttendanceRecordDto>> CreateAttendanceAsync(
            CreateAttendanceDto dto, Guid recordedByUserId)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            if (dto.AbsenceDate > today)
            {
                return Result<AttendanceRecordDto>.Validation("Absence date cannot be in the future");
            }

            var activeYear = await _context.AcademicYears.FirstOrDefaultAsync(a => a.IsActive);
            if (activeYear != null && (dto.AbsenceDate < activeYear.StartDate || dto.AbsenceDate > activeYear.EndDate))
            {
                return Result<AttendanceRecordDto>.Validation(
                    "Absence date must be within the current academic year");
            }

            var duplicate = await _context.AttendanceRecords
                .AnyAsync(a => a.StudentId == dto.StudentId && a.AbsenceDate == dto.AbsenceDate);
            if (duplicate)
            {
                return Result<AttendanceRecordDto>.Conflict(
                    "Attendance record already exists for this student on this date");
            }

            var student = await _context.Students
                .Include(s => s.ParentContact)
                .FirstOrDefaultAsync(s => s.Id == dto.StudentId);
            if (student == null) return Result<AttendanceRecordDto>.NotFound("Student not found");

            if (!await _context.Classes.AnyAsync(c => c.Id == dto.ClassId))
                return Result<AttendanceRecordDto>.NotFound("Class not found");

            AttendanceRecord record;
            try
            {
                record = student.MarkAttendance(dto.ClassId, dto.AbsenceDate, recordedByUserId);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is InvalidOperationException)
            {
                return Result<AttendanceRecordDto>.Validation(ex.Message);
            }

            _context.AttendanceRecords.Add(record);
            await _context.SaveChangesAsync();

            if (student.ParentContact != null)
            {
                var totalAbsences = await _context.AttendanceRecords
                    .CountAsync(a => a.StudentId == dto.StudentId);

                await _emailService.TrySendEmailAsync(
                    student.ParentContact.Email,
                    $"Absence Notice: {student.FullName}",
                    $"Dear {student.ParentContact.FullName},\n\n" +
                    $"This is to inform you that {student.FullName} was absent from school on {dto.AbsenceDate:M/d/yyyy}.\n\n" +
                    $"Total absences this academic year: {totalAbsences}\n\n" +
                    "If you have any questions, please contact the school administration.");
            }

            var created = await _context.AttendanceRecords
                .Include(a => a.Student)
                .Include(a => a.Class)
                .Include(a => a.RecordedByUser)
                .FirstAsync(a => a.Id == record.Id);

            return Result<AttendanceRecordDto>.Created(new AttendanceRecordDto
            {
                Id = created.Id,
                StudentId = created.StudentId,
                StudentName = created.Student.FullName,
                ClassId = created.ClassId,
                ClassName = created.Class.Name,
                AbsenceDate = created.AbsenceDate,
                RecordedByName = created.RecordedByUser.Username,
                RecordedAt = created.RecordedAt
            }, "Attendance recorded");
        }

        public async Task<Result<Unit>> DeleteAttendanceAsync(Guid id)
        {
            var record = await _context.AttendanceRecords.FindAsync(id);
            if (record == null) return Result<Unit>.NotFound("Attendance record not found");

            _context.AttendanceRecords.Remove(record);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Attendance record deleted");
        }

        public async Task<Result<AttendanceSummaryDto>> GetStudentSummaryAsync(
            Guid studentId, Guid? academicYearId)
        {
            var query = _context.AttendanceRecords.Where(a => a.StudentId == studentId);

            AcademicYear? year = null;
            if (academicYearId.HasValue)
            {
                year = await _context.AcademicYears.FindAsync(academicYearId.Value);
            }
            year ??= await _context.AcademicYears.FirstOrDefaultAsync(a => a.IsActive);

            if (year != null)
            {
                query = query.Where(a => a.AbsenceDate >= year.StartDate && a.AbsenceDate <= year.EndDate);
            }

            var absenceDates = await query
                .OrderByDescending(a => a.AbsenceDate)
                .Select(a => a.AbsenceDate)
                .ToListAsync();

            return Result<AttendanceSummaryDto>.Ok(new AttendanceSummaryDto
            {
                TotalAbsences = absenceDates.Count,
                AbsenceDates = absenceDates
            }, "Attendance summary retrieved");
        }
    }
}
