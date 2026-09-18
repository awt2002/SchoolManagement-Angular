namespace SMS.Domain.Entities
{
    public class PasswordResetToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UsedAt { get; set; }
        public User User { get; set; } = null!;

        public bool IsUsable(DateTime asOf) => UsedAt == null && ExpiresAt > asOf;

        public void Consume(DateTime asOf)
        {
            if (UsedAt != null)
            {
                throw new InvalidOperationException("This password reset token has already been used.");
            }
            UsedAt = asOf;
        }
    }
}
