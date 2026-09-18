namespace SMS.Domain.Entities
{
    public class Subject : IAuditable
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Guid ClassId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public Class Class { get; set; } = null!;
        public List<GradeCategory> GradeCategories { get; set; } = new List<GradeCategory>();
        public List<Exam> Exams { get; set; } = new List<Exam>();

        public GradeCategory AddCategory(string name, decimal weight)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Category name is required.", nameof(name));
            if (weight <= 0 || weight > 100)
                throw new InvalidOperationException("Weight must be between 0 (exclusive) and 100.");

            var currentSum = GradeCategories.Sum(c => c.Weight);
            if (currentSum + weight > 100)
                throw new InvalidOperationException("Total weight cannot exceed 100%.");

            var category = new GradeCategory
            {
                Id = Guid.NewGuid(),
                SubjectId = Id,
                Name = name,
                Weight = weight
            };
            GradeCategories.Add(category);
            return category;
        }

        public void UpdateCategoryWeight(Guid categoryId, string newName, decimal newWeight)
        {
            if (newWeight <= 0 || newWeight > 100)
                throw new InvalidOperationException("Weight must be between 0 (exclusive) and 100.");

            var otherSum = GradeCategories
                .Where(c => c.Id != categoryId)
                .Sum(c => c.Weight);
            if (otherSum + newWeight > 100)
                throw new InvalidOperationException("Total weight cannot exceed 100%.");

            var category = GradeCategories.FirstOrDefault(c => c.Id == categoryId)
                ?? throw new InvalidOperationException("Category not found on this subject.");
            category.Name = newName;
            category.Weight = newWeight;
        }
    }
}
