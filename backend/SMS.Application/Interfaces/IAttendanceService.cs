using SMS.Application.Common;
using SMS.Application.Features.Attendance.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IAttendanceService
    {
        Task<Result<List<AttendanceRecordDto>>> GetAttendanceAsync(Guid? classId, Guid? studentId, DateOnly? from, DateOnly? to);
        Task<Result<AttendanceRecordDto>> CreateAttendanceAsync(CreateAttendanceDto dto, Guid recordedByUserId);
        Task<Result<Unit>> DeleteAttendanceAsync(Guid id);
        Task<Result<AttendanceSummaryDto>> GetStudentSummaryAsync(Guid studentId, Guid? academicYearId);
    }
}
