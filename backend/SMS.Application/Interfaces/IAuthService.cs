using SMS.Application.Common;
using SMS.Application.Features.Auth.DTOs;

namespace SMS.Application.Interfaces
{
    public interface IAuthService
    {
        Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto);
        Task<Result<RefreshResponseDto>> RefreshTokenAsync();
        Task<Result<Unit>> LogoutAsync();
        Task<Result<Unit>> ChangePasswordAsync(Guid userId, ChangePasswordDto dto);
        Task<Result<Unit>> RequestPasswordResetAsync(ForgotPasswordRequestDto dto);
        Task<Result<Unit>> ResetPasswordAsync(ResetPasswordDto dto);
    }
}
