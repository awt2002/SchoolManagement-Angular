using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SMS.API.Extensions;
using SMS.Application.Common;
using SMS.Application.Features.Auth.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/auth")]
    [EnableRateLimiting("auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ICurrentUser _currentUser;

        public AuthController(IAuthService authService, ICurrentUser currentUser)
        {
            _authService = authService;
            _currentUser = currentUser;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
        {
            if (string.IsNullOrEmpty(dto.Username) || string.IsNullOrEmpty(dto.Password))
            {
                return Result<LoginResponseDto>.Validation(
                    "Validation failed", "Username and password are required").ToActionResult();
            }
            return (await _authService.LoginAsync(dto)).ToActionResult();
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
            => (await _authService.RequestPasswordResetAsync(dto)).ToActionResult();

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
            => (await _authService.ResetPasswordAsync(dto)).ToActionResult();

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
            => (await _authService.RefreshTokenAsync()).ToActionResult();

        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
            => (await _authService.LogoutAsync()).ToActionResult();

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            if (_currentUser.UserId == Guid.Empty)
            {
                return Result<Unit>.Unauthorized().ToActionResult();
            }
            return (await _authService.ChangePasswordAsync(_currentUser.UserId, dto)).ToActionResult();
        }
    }
}
