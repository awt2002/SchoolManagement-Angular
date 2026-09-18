using SMS.Application.Common;
using SMS.Application.Features.Dashboard.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IDashboardService
    {
        Task<Result<AdminDashboardDto>> GetAdminDashboardAsync(Guid userId);
        Task<Result<TeacherDashboardDto>> GetTeacherDashboardAsync(Guid userId);
        Task<Result<StudentDashboardDto>> GetStudentDashboardAsync(Guid userId);
    }
}
