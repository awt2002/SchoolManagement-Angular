namespace SMS.Domain.Entities
{
    public class GradeCategory : IAuditable
    {
        public Guid Id { get; set; }
        public Guid SubjectId { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Weight { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Subject Subject { get; set; } = null!;
        public List<Grade> Grades { get; set; } = new List<Grade>();
    }
}
