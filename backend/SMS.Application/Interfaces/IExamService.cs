using SMS.Application.Common;
using SMS.Application.Features.Exams.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IExamService
    {
        Task<Result<List<ExamDto>>> GetExamsAsync(Guid? subjectId, Guid? classId, DateOnly? from, DateOnly? to);
        Task<Result<ExamDto>> CreateExamAsync(CreateExamDto dto, Guid createdByUserId);
        Task<Result<ExamDto>> GetExamByIdAsync(Guid id);
        Task<Result<ExamDto>> UpdateExamAsync(Guid id, UpdateExamDto dto);
        Task<Result<List<ExamResultDto>>> GetExamResultsAsync(Guid examId);
        Task<Result<List<ExamResultDto>>> CreateExamResultsAsync(Guid examId, BulkExamResultDto dto, Guid enteredByUserId);
        Task<Result<ExamResultDetailDto>> GetStudentExamResultAsync(Guid examId, Guid studentId);
        Task<Result<Unit>> DeleteExamAsync(Guid id);
    }
}
