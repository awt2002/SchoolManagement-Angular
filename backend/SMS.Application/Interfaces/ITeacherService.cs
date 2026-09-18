using SMS.Application.Common;
using SMS.Application.Features.Teachers.DTOs;

namespace SMS.Application.Interfaces
{
    public interface ITeacherService
    {
        Task<Result<PagedList<TeacherDto>>> GetAllTeachersAsync(int page, int pageSize, string? search, bool includeInactive, bool inactiveOnly);
        Task<Result<TeacherDto>> GetTeacherByIdAsync(Guid id);
        Task<Result<TeacherDto>> GetTeacherByUserIdAsync(Guid userId);
        Task<Result<TeacherDto>> CreateTeacherAsync(CreateTeacherDto dto);
        Task<Result<TeacherDto>> UpdateTeacherAsync(Guid id, UpdateTeacherDto dto);
        Task<Result<Unit>> DeleteTeacherAsync(Guid id);
        Task<Result<Unit>> ReactivateTeacherAsync(Guid id);
    }
}
