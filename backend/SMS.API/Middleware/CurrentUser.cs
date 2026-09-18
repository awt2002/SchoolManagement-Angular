using System.Security.Claims;
using SMS.Application.Interfaces;
using SMS.Domain.Enums;

namespace SMS.API.Middleware
{
    public class CurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUser(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid UserId
        {
            get
            {
                var claim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier);
                if (claim != null && Guid.TryParse(claim.Value, out var id))
                {
                    return id;
                }
                return Guid.Empty;
            }
        }

        public UserRole Role
        {
            get
            {
                var roleClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role)?.Value;

                if (Enum.TryParse<UserRole>(roleClaim, ignoreCase: true, out var role)
                    && Enum.IsDefined(role))
                {
                    return role;
                }
                return UserRole.Student;
            }
        }
    }
}
