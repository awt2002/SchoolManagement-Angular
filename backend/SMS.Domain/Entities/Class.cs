namespace SMS.Domain.Entities
{
    public class Class : IAuditable
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int GradeLevel { get; set; }
        public Guid AcademicYearId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // The foreign key for this one-to-one lives on Teacher.ClassId. Reading the
        // teacher through this navigation keeps a single source of truth; a second
        // Class.TeacherId column would be free to disagree with it.
        public Teacher? Teacher { get; set; }

        public AcademicYear AcademicYear { get; set; } = null!;
        public List<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public List<Subject> Subjects { get; set; } = new List<Subject>();
        public List<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
        public List<Announcement> Announcements { get; set; } = new List<Announcement>();

        public bool CanChangeAcademicYear() => Enrollments.Count == 0;

        // Enrollments are historical (student, class, year); refuse to change the year if any exist.
        public void ChangeAcademicYear(Guid newAcademicYearId)
        {
            if (newAcademicYearId == AcademicYearId) return;
            if (!CanChangeAcademicYear())
            {
                throw new InvalidOperationException(
                    "Cannot change academic year while the class has enrollments. Remove enrollments first.");
            }
            AcademicYearId = newAcademicYearId;
        }
    }
}
