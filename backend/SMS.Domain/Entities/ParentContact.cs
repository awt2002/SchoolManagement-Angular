namespace SMS.Domain.Entities
{
    public class ParentContact : IAuditable
    {
        public Guid Id { get; set; }
        public Guid StudentId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Student Student { get; set; } = null!;
    }
}
