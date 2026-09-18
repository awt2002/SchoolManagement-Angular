using SMS.Application.Common;
using SMS.Application.Features.Classes.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IClassQueryService
    {
        Task<Result<List<ClassDto>>> GetAllAsync(Guid? academicYearId, Guid? teacherId);
        Task<Result<ClassDetailDto>> GetByIdAsync(Guid id);
    }
}
