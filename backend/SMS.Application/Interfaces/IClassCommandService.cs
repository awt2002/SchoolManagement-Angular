using SMS.Application.Common;
using SMS.Application.Features.Classes.DTOs;
using SMS.Application.Features.Students.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IClassCommandService
    {
        Task<Result<ClassDto>> CreateAsync(CreateClassDto dto);
        Task<Result<ClassDto>> UpdateAsync(Guid id, UpdateClassDto dto);
        Task<Result<Unit>> DeleteAsync(Guid id);
        Task<Result<EnrollmentDto>> EnrollStudentAsync(Guid classId, EnrollStudentDto dto);
        Task<Result<Unit>> RemoveStudentAsync(Guid classId, Guid studentId);
    }
}
