using SMS.Domain.Enums;

namespace SMS.Domain.Entities
{
    public class Announcement : IAuditable
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public AnnouncementScope Scope { get; set; }
        public Guid? ClassId { get; set; }
        public Guid AuthorId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Class? Class { get; set; }
        public User Author { get; set; } = null!;
        public List<AnnouncementReadStatus> ReadStatuses { get; set; } = new List<AnnouncementReadStatus>();

        // Returns the new status if a row was added, null when already marked read.
        public AnnouncementReadStatus? MarkReadBy(Guid userId)
        {
            if (ReadStatuses.Any(rs => rs.UserId == userId)) return null;

            var status = new AnnouncementReadStatus
            {
                Id = Guid.NewGuid(),
                AnnouncementId = Id,
                UserId = userId,
                ReadAt = DateTime.UtcNow
            };
            ReadStatuses.Add(status);
            return status;
        }
    }
}
