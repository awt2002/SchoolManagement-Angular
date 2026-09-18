using SMS.Application.Common;
using SMS.Application.Features.Students.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IStudentQueryService
    {
        Task<Result<PagedList<StudentSummaryDto>>> GetAllAsync(
            int page, int pageSize, string? search, int? gradeLevel,
            Guid? classId, Guid? academicYearId, bool includeInactive, bool inactiveOnly);
        Task<Result<StudentDetailDto>> GetByIdAsync(Guid id);
        Task<Result<StudentDetailDto>> GetByUserIdAsync(Guid userId);
        Task<Result<List<EnrollmentDto>>> GetEnrollmentsAsync(Guid studentId);
    }
}
