using SMS.Domain.Enums;

namespace SMS.Application.Interfaces
{
    public interface ICurrentUser
    {
        Guid UserId { get; }
        UserRole Role { get; }
    }
}
