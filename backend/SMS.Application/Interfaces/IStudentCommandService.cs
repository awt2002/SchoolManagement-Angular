using SMS.Application.Common;
using SMS.Application.Features.Students.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IStudentCommandService
    {
        Task<Result<StudentDetailDto>> CreateAsync(CreateStudentDto dto);
        Task<Result<StudentDetailDto>> UpdateAsync(Guid id, UpdateStudentDto dto);
        Task<Result<Unit>> DeleteAsync(Guid id);
        Task<Result<Unit>> ReactivateAsync(Guid id);
    }
}
