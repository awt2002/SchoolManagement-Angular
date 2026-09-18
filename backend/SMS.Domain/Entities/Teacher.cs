namespace SMS.Domain.Entities
{
    public class Teacher : IAuditable
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public Guid? ClassId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public User User { get; set; } = null!;
        public Class? Class { get; set; }
    }
}
