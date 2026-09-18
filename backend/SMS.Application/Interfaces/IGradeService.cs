using SMS.Application.Common;
using SMS.Application.Features.Grades.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IGradeService
    {
        Task<Result<List<GradeDto>>> GetGradesAsync(Guid? subjectId, Guid? studentId, Guid? academicYearId);
        Task<Result<GradeDto>> CreateOrUpdateGradeAsync(CreateGradeDto dto, Guid enteredByUserId);
        Task<Result<GradeSummaryDto>> GetGradeSummaryAsync(Guid? studentId, Guid? classId, Guid? academicYearId);
        Task<Result<PagedList<GradeAuditLogDto>>> GetAuditLogAsync(Guid? studentId, Guid? subjectId, DateOnly? from, DateOnly? to, int page, int pageSize);
    }
}
