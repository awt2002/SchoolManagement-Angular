using SMS.Application.Common;
using SMS.Application.Features.Announcements.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IAnnouncementService
    {
        Task<Result<PagedList<AnnouncementDto>>> GetAnnouncementsAsync(Guid userId, string userRole, int page, int pageSize);
        Task<Result<AnnouncementDto>> CreateAnnouncementAsync(CreateAnnouncementDto dto, Guid authorId, string authorRole);
        Task<Result<AnnouncementDto>> GetAnnouncementByIdAsync(Guid id, Guid userId, string userRole);
        Task<Result<Unit>> MarkAsReadAsync(Guid announcementId, Guid userId, string userRole);
        Task<Result<UnreadCountDto>> GetUnreadCountAsync(Guid userId, string userRole);
        Task<Result<AnnouncementDto>> UpdateAnnouncementAsync(Guid id, UpdateAnnouncementDto dto, Guid userId, string userRole);
        Task<Result<Unit>> DeleteAnnouncementAsync(Guid id, Guid userId, string userRole);
    }
}
