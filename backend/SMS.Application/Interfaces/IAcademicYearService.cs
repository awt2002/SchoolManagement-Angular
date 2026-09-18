using SMS.Application.Common;
using SMS.Application.Features.AcademicYears.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IAcademicYearService
    {
        Task<Result<List<AcademicYearDto>>> GetAllAsync();
        Task<Result<AcademicYearDto>> CreateAsync(CreateAcademicYearDto dto);
        Task<Result<AcademicYearDto>> UpdateAsync(Guid id, UpdateAcademicYearDto dto);
        Task<Result<AcademicYearDto>> ActivateAsync(Guid id);
        Task<Result<Unit>> DeleteAsync(Guid id);
    }
}
