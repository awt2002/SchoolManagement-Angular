using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.Announcements.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Domain.Enums;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class AnnouncementService : IAnnouncementService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public AnnouncementService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task<Result<PagedList<AnnouncementDto>>> GetAnnouncementsAsync(
            Guid userId, string userRole, int page, int pageSize)
        {
            (page, pageSize) = Pagination.Normalize(page, pageSize);

            var classId = await ResolveUserClassIdAsync(userId, userRole);

            var query = _context.Announcements
                .Include(a => a.Author)
                .Include(a => a.Class)
                .Include(a => a.ReadStatuses)
                .AsQueryable();

            if (userRole == "Student" || userRole == "Teacher")
            {
                query = classId.HasValue
                    ? query.Where(a => a.Scope == AnnouncementScope.SchoolWide ||
                                       (a.Scope == AnnouncementScope.ClassOnly && a.ClassId == classId.Value))
                    : query.Where(a => a.Scope == AnnouncementScope.SchoolWide);
            }

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new AnnouncementDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Body = a.Body,
                    Scope = a.Scope.ToString(),
                    AuthorName = a.Author.Username,
                    ClassId = a.ClassId,
                    ClassName = a.Class != null ? a.Class.Name : null,
                    CreatedAt = a.CreatedAt,
                    IsRead = a.ReadStatuses.Any(rs => rs.UserId == userId)
                })
                .ToListAsync();

            return Result<PagedList<AnnouncementDto>>.Ok(
                new PagedList<AnnouncementDto>(items, page, pageSize, totalCount),
                "Announcements retrieved");
        }

        public async Task<Result<AnnouncementDto>> CreateAnnouncementAsync(
            CreateAnnouncementDto dto, Guid authorId, string authorRole)
        {
            if (dto.Scope == AnnouncementScope.ClassOnly && !dto.ClassId.HasValue)
                return Result<AnnouncementDto>.Validation("ClassId is required for a class-scoped announcement.");

            if (dto.Scope == AnnouncementScope.SchoolWide && dto.ClassId.HasValue)
                return Result<AnnouncementDto>.Validation("ClassId must be omitted for a school-wide announcement.");

            if (dto.ClassId.HasValue &&
                !await _context.Classes.AnyAsync(c => c.Id == dto.ClassId.Value))
            {
                return Result<AnnouncementDto>.NotFound("Class not found");
            }

            if (authorRole != "Admin")
            {
                if (dto.Scope != AnnouncementScope.ClassOnly)
                    return Result<AnnouncementDto>.Forbidden("Only administrators can post school-wide announcements.");

                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == authorId);
                if (teacher?.ClassId == null)
                    return Result<AnnouncementDto>.Forbidden("You are not assigned to a class.");

                if (dto.ClassId != teacher.ClassId)
                    return Result<AnnouncementDto>.Forbidden("You can only post announcements to your own class.");
            }

            var announcement = new Announcement
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Body = dto.Body,
                Scope = dto.Scope,
                ClassId = dto.ClassId,
                AuthorId = authorId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            var author = await _context.Users.FindAsync(authorId);
            var authorName = author?.Username ?? "System";

            List<User> targetUsers;
            if (dto.Scope == AnnouncementScope.SchoolWide)
            {
                targetUsers = await _context.Users.Where(u => u.IsActive).ToListAsync();
            }
            else
            {
                var studentUserIds = await _context.Enrollments
                    .Where(e => e.ClassId == dto.ClassId)
                    .Include(e => e.Student)
                    .Select(e => e.Student.UserId)
                    .ToListAsync();

                var teacherUserId = await _context.Teachers
                    .Where(t => t.ClassId == dto.ClassId)
                    .Select(t => t.UserId)
                    .FirstOrDefaultAsync();

                var userIds = new List<Guid>(studentUserIds);
                if (teacherUserId != Guid.Empty) userIds.Add(teacherUserId);

                targetUsers = await _context.Users
                    .Where(u => userIds.Contains(u.Id) && u.IsActive)
                    .ToListAsync();
            }

            foreach (var user in targetUsers)
            {
                await _emailService.TrySendEmailAsync(user.Email,
                    $"New Announcement: {announcement.Title}",
                    $"Dear {user.Username},\n\n" +
                    $"A new announcement has been posted by {authorName}:\n\n" +
                    $"Title: {announcement.Title}\n\n" +
                    $"{announcement.Body}\n\n" +
                    "Please log in to the School Management System to view the full announcement.");
            }

            var created = await _context.Announcements
                .Include(a => a.Author)
                .Include(a => a.Class)
                .FirstAsync(a => a.Id == announcement.Id);

            return Result<AnnouncementDto>.Created(new AnnouncementDto
            {
                Id = created.Id,
                Title = created.Title,
                Body = created.Body,
                Scope = created.Scope.ToString(),
                AuthorName = created.Author.Username,
                ClassId = created.ClassId,
                ClassName = created.Class?.Name,
                CreatedAt = created.CreatedAt,
                IsRead = false
            }, "Announcement created");
        }

        public async Task<Result<AnnouncementDto>> GetAnnouncementByIdAsync(Guid id, Guid userId, string userRole)
        {
            var announcement = await _context.Announcements
                .Include(a => a.Author)
                .Include(a => a.Class)
                .Include(a => a.ReadStatuses)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (announcement == null) return Result<AnnouncementDto>.NotFound("Announcement not found");

            if (!await CanViewAsync(announcement, userId, userRole))
                return Result<AnnouncementDto>.Forbidden("You do not have access to this announcement");

            return Result<AnnouncementDto>.Ok(new AnnouncementDto
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Body = announcement.Body,
                Scope = announcement.Scope.ToString(),
                AuthorName = announcement.Author.Username,
                ClassId = announcement.ClassId,
                ClassName = announcement.Class?.Name,
                CreatedAt = announcement.CreatedAt,
                IsRead = announcement.ReadStatuses.Any(rs => rs.UserId == userId)
            }, "Announcement retrieved");
        }

        public async Task<Result<Unit>> MarkAsReadAsync(Guid announcementId, Guid userId, string userRole)
        {
            var announcement = await _context.Announcements
                .Include(a => a.ReadStatuses)
                .FirstOrDefaultAsync(a => a.Id == announcementId);
            if (announcement == null) return Result<Unit>.NotFound("Announcement not found");

            if (!await CanViewAsync(announcement, userId, userRole))
                return Result<Unit>.Forbidden("You do not have access to this announcement");

            var status = announcement.MarkReadBy(userId);
            if (status != null)
            {
                _context.AnnouncementReadStatuses.Add(status);
                await _context.SaveChangesAsync();
            }
            return Result<Unit>.Ok(Unit.Value, "Marked as read");
        }

        public async Task<Result<UnreadCountDto>> GetUnreadCountAsync(Guid userId, string userRole)
        {
            var classId = await ResolveUserClassIdAsync(userId, userRole);
            var query = _context.Announcements.AsQueryable();

            if (userRole == "Student" || userRole == "Teacher")
            {
                query = classId.HasValue
                    ? query.Where(a => a.Scope == AnnouncementScope.SchoolWide ||
                                       (a.Scope == AnnouncementScope.ClassOnly && a.ClassId == classId.Value))
                    : query.Where(a => a.Scope == AnnouncementScope.SchoolWide);
            }

            var readIds = await _context.AnnouncementReadStatuses
                .Where(rs => rs.UserId == userId)
                .Select(rs => rs.AnnouncementId)
                .ToListAsync();

            var count = await query.CountAsync(a => !readIds.Contains(a.Id));
            return Result<UnreadCountDto>.Ok(new UnreadCountDto { Count = count }, "Unread count retrieved");
        }

        public async Task<Result<AnnouncementDto>> UpdateAnnouncementAsync(
            Guid id, UpdateAnnouncementDto dto, Guid userId, string userRole)
        {
            var announcement = await _context.Announcements
                .Include(a => a.Author)
                .Include(a => a.Class)
                .Include(a => a.ReadStatuses)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (announcement == null) return Result<AnnouncementDto>.NotFound("Announcement not found");
            if (userRole != "Admin" && announcement.AuthorId != userId)
                return Result<AnnouncementDto>.Forbidden("You can only edit your own announcements");

            announcement.Title = dto.Title;
            announcement.Body = dto.Body;
            await _context.SaveChangesAsync();

            return Result<AnnouncementDto>.Ok(new AnnouncementDto
            {
                Id = announcement.Id,
                Title = announcement.Title,
                Body = announcement.Body,
                Scope = announcement.Scope.ToString(),
                AuthorName = announcement.Author.Username,
                ClassId = announcement.ClassId,
                ClassName = announcement.Class?.Name,
                CreatedAt = announcement.CreatedAt,
                IsRead = announcement.ReadStatuses.Any(rs => rs.UserId == userId)
            }, "Announcement updated");
        }

        public async Task<Result<Unit>> DeleteAnnouncementAsync(Guid id, Guid userId, string userRole)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null) return Result<Unit>.NotFound("Announcement not found");
            if (userRole != "Admin" && announcement.AuthorId != userId)
                return Result<Unit>.Forbidden("You can only delete your own announcements");

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Announcement deleted");
        }

        private async Task<bool> CanViewAsync(Announcement announcement, Guid userId, string userRole)
        {
            if (userRole == "Admin") return true;
            if (announcement.AuthorId == userId) return true;

            if (announcement.Scope == AnnouncementScope.SchoolWide) return true;

            if (announcement.ClassId == null) return false;

            var classId = await ResolveUserClassIdAsync(userId, userRole);
            return classId.HasValue && classId.Value == announcement.ClassId.Value;
        }

        private async Task<Guid?> ResolveUserClassIdAsync(Guid userId, string role)
        {
            if (role == "Teacher")
            {
                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == userId);
                return teacher?.ClassId;
            }

            if (role == "Student")
            {
                var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
                if (student == null) return null;

                var enrollment = await _context.Enrollments
                    .Where(e => e.StudentId == student.Id)
                    .OrderByDescending(e => e.EnrolledAt)
                    .FirstOrDefaultAsync();
                return enrollment?.ClassId;
            }
            return null;
        }
    }
}
