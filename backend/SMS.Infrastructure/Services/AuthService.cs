using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SMS.Application.Common;
using SMS.Application.Features.Auth.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private const int PasswordResetTokenLifetimeMinutes = 30;

        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IRefreshTokenCookieProvider _cookieProvider;

        public AuthService(
            AppDbContext context,
            IConfiguration configuration,
            IEmailService emailService,
            IRefreshTokenCookieProvider cookieProvider)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _cookieProvider = cookieProvider;
        }

        public async Task<Result<LoginResponseDto>> LoginAsync(LoginRequestDto dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null) return Result<LoginResponseDto>.Unauthorized("Invalid username or password");
            if (!user.IsActive) return Result<LoginResponseDto>.Unauthorized("Account is deactivated");

            if (!VerifyPassword(dto.Password, user.PasswordHash))
                return Result<LoginResponseDto>.Unauthorized("Invalid username or password");

            var accessToken = GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenLifetimeMinutes());

            var refreshToken = GenerateSecureToken();
            var entity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                Token = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };
            _context.RefreshTokens.Add(entity);
            await _context.SaveChangesAsync();

            _cookieProvider.Write(refreshToken, entity.ExpiresAt);

            return Result<LoginResponseDto>.Ok(new LoginResponseDto
            {
                AccessToken = accessToken,
                ExpiresAt = expiresAt,
                User = new UserInfoDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Role = user.Role.ToString()
                }
            }, "Login successful");
        }

        public async Task<Result<RefreshResponseDto>> RefreshTokenAsync()
        {
            var refreshToken = _cookieProvider.Read() ?? string.Empty;
            if (string.IsNullOrEmpty(refreshToken))
            {
                _cookieProvider.Clear();
                return Result<RefreshResponseDto>.Unauthorized("Refresh token is required");
            }

            var storedToken = await _context.RefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

            if (storedToken == null)
            {
                _cookieProvider.Clear();
                return Result<RefreshResponseDto>.Unauthorized("Invalid or expired refresh token");
            }

            if (storedToken.RevokedAt != null)
            {
                await RevokeAllActiveRefreshTokensAsync(storedToken.UserId);
                _cookieProvider.Clear();
                return Result<RefreshResponseDto>.Unauthorized("Invalid or expired refresh token");
            }

            if (storedToken.ExpiresAt < DateTime.UtcNow)
            {
                storedToken.RevokedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _cookieProvider.Clear();
                return Result<RefreshResponseDto>.Unauthorized("Invalid or expired refresh token");
            }

            if (!storedToken.User.IsActive)
            {
                _cookieProvider.Clear();
                return Result<RefreshResponseDto>.Unauthorized("Account is deactivated");
            }

            storedToken.RevokedAt = DateTime.UtcNow;

            var newRefresh = GenerateSecureToken();
            var newEntity = new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = storedToken.UserId,
                Token = newRefresh,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow
            };
            _context.RefreshTokens.Add(newEntity);
            await _context.SaveChangesAsync();

            var accessToken = GenerateJwtToken(storedToken.User);
            var expiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenLifetimeMinutes());

            _cookieProvider.Write(newRefresh, newEntity.ExpiresAt);

            return Result<RefreshResponseDto>.Ok(new RefreshResponseDto
            {
                AccessToken = accessToken,
                ExpiresAt = expiresAt
            }, "Token refreshed");
        }

        private async Task RevokeAllActiveRefreshTokensAsync(Guid userId)
        {
            var activeTokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null && rt.ExpiresAt >= DateTime.UtcNow)
                .ToListAsync();
            if (activeTokens.Count == 0) return;

            foreach (var token in activeTokens) token.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<Result<Unit>> LogoutAsync()
        {
            var refreshToken = _cookieProvider.Read();
            if (!string.IsNullOrEmpty(refreshToken))
            {
                var stored = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
                if (stored != null)
                {
                    stored.RevokedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            _cookieProvider.Clear();
            return Result<Unit>.Ok(Unit.Value, "Logged out successfully");
        }

        public async Task<Result<Unit>> ChangePasswordAsync(Guid userId, ChangePasswordDto dto)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return Result<Unit>.NotFound("User not found");

            if (!VerifyPassword(dto.CurrentPassword, user.PasswordHash))
                return Result<Unit>.Validation("Current password is incorrect", "Current password is incorrect");

            if (dto.NewPassword != dto.ConfirmNewPassword)
                return Result<Unit>.Validation(
                    "New password and confirmation do not match",
                    "New password and confirmation do not match");

            var errors = ValidatePasswordRules(dto.NewPassword);
            if (errors.Count > 0)
                return Result<Unit>.Validation("Validation failed", errors.ToArray());

            user.PasswordHash = HashPassword(dto.NewPassword);

            await RevokeSessionsAndResetsAsync(user.Id);

            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Password changed successfully");
        }

        public async Task<Result<Unit>> RequestPasswordResetAsync(ForgotPasswordRequestDto dto)
        {
            var identifier = (dto.Email ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(identifier))
                return Result<Unit>.Validation("Email or username is required.", "Email or username is required.");

            var normalized = identifier.ToLower();

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.IsActive &&
                (u.Email.ToLower() == normalized || u.Username.ToLower() == normalized));

            string? targetEmail = user?.Email;

            if (user == null)
            {
                var student = await _context.Students
                    .Include(s => s.User)
                    .Include(s => s.ParentContact)
                    .Where(s => s.User.IsActive
                        && s.ParentContact != null
                        && s.ParentContact.Email.ToLower() == normalized)
                    .FirstOrDefaultAsync();

                if (student != null)
                {
                    user = student.User;
                    targetEmail = student.ParentContact!.Email;
                }
            }

            if (user != null && !string.IsNullOrWhiteSpace(targetEmail))
            {
                var now = DateTime.UtcNow;

                var outstanding = await _context.PasswordResetTokens
                    .Where(t => t.UserId == user.Id && t.UsedAt == null)
                    .ToListAsync();
                foreach (var stale in outstanding) stale.UsedAt = now;

                var rawToken = GenerateSecureToken();
                _context.PasswordResetTokens.Add(new PasswordResetToken
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    TokenHash = HashResetToken(rawToken),
                    ExpiresAt = now.AddMinutes(PasswordResetTokenLifetimeMinutes),
                    CreatedAt = now
                });
                await _context.SaveChangesAsync();

                var frontendBaseUrl = _configuration["Frontend:BaseUrl"] ?? "http://localhost:4200";
                var resetLink = $"{frontendBaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";

                await _emailService.TrySendEmailAsync(
                    targetEmail,
                    "SMS Password Reset",
                    $"Use this link to reset your password: {resetLink}");
            }

            return Result<Unit>.Ok(Unit.Value,
                "If the account exists, a password reset link will be sent. Please check your spam folder.");
        }

        public async Task<Result<Unit>> ResetPasswordAsync(ResetPasswordDto dto)
        {
            if (dto.NewPassword != dto.ConfirmNewPassword)
                return Result<Unit>.Validation(
                    "New password and confirmation do not match",
                    "New password and confirmation do not match");

            var errors = ValidatePasswordRules(dto.NewPassword);
            if (errors.Count > 0) return Result<Unit>.Validation("Validation failed", errors.ToArray());

            if (string.IsNullOrWhiteSpace(dto.Token))
                return Result<Unit>.Validation("Invalid or expired reset token", "Invalid or expired reset token");

            var now = DateTime.UtcNow;
            var tokenHash = HashResetToken(dto.Token);

            var resetToken = await _context.PasswordResetTokens
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

            if (resetToken == null || !resetToken.IsUsable(now))
                return Result<Unit>.Validation("Invalid or expired reset token", "Invalid or expired reset token");

            if (!resetToken.User.IsActive)
                return Result<Unit>.Validation("Invalid or expired reset token", "Invalid or expired reset token");

            resetToken.Consume(now);
            resetToken.User.PasswordHash = HashPassword(dto.NewPassword);

            await RevokeSessionsAndResetsAsync(resetToken.UserId);

            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Password recovered successfully");
        }

        private async Task RevokeSessionsAndResetsAsync(Guid userId)
        {
            var now = DateTime.UtcNow;

            var sessions = await _context.RefreshTokens
                .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
                .ToListAsync();
            foreach (var session in sessions) session.RevokedAt = now;

            var resets = await _context.PasswordResetTokens
                .Where(t => t.UserId == userId && t.UsedAt == null)
                .ToListAsync();
            foreach (var reset in resets) reset.UsedAt = now;
        }


        private SymmetricSecurityKey GetSigningKey()
        {
            var secret = _configuration["Jwt:Secret"] ?? "SuperSecretKeyThatIsLongEnoughForHmacSha256!";
            return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        }

        private int GetAccessTokenLifetimeMinutes()
        {
            var configured = _configuration["Jwt:ExpiryMinutes"];
            if (string.IsNullOrWhiteSpace(configured)) return 60;
            if (!int.TryParse(configured, out var minutes) || minutes <= 0)
            {
                throw new InvalidOperationException(
                    $"Jwt:ExpiryMinutes must be a positive whole number of minutes, but was '{configured}'.");
            }
            return minutes;
        }

        private string GenerateJwtToken(User user)
        {
            var credentials = new SigningCredentials(GetSigningKey(), SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
                new Claim("role", user.Role.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"] ?? "SMS",
                audience: _configuration["Jwt:Audience"] ?? "SMS",
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(GetAccessTokenLifetimeMinutes()),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private static string GenerateSecureToken()
        {
            var randomBytes = RandomNumberGenerator.GetBytes(64);
            return Base64UrlEncoder.Encode(randomBytes);
        }

        private static string HashResetToken(string token) =>
            Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

        private static readonly PasswordHasher<User> _passwordHasher = new();

        public static string HashPassword(string password)
        {
            return _passwordHasher.HashPassword(null!, password);
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            var result = _passwordHasher.VerifyHashedPassword(null!, storedHash, password);
            return result == PasswordVerificationResult.Success
                || result == PasswordVerificationResult.SuccessRehashNeeded;
        }

        public static string GenerateRandomPassword(int length = 12)
        {
            const string upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
            const string lower = "abcdefghijkmnpqrstuvwxyz";
            const string digits = "23456789";
            const string all = upper + lower + digits;

            if (length < 8) length = 8;

            var characters = new char[length];
            characters[0] = Pick(upper);
            characters[1] = Pick(digits);
            for (var i = 2; i < length; i++) characters[i] = Pick(all);

            for (var i = characters.Length - 1; i > 0; i--)
            {
                var j = RandomNumberGenerator.GetInt32(i + 1);
                (characters[i], characters[j]) = (characters[j], characters[i]);
            }

            return new string(characters);

            static char Pick(string alphabet) => alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
        }

        private static List<string> ValidatePasswordRules(string password)
        {
            var errors = new List<string>();
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                errors.Add("Password must be at least 8 characters.");
            if (!password.Any(char.IsUpper))
                errors.Add("Password must include at least one uppercase letter.");
            if (!password.Any(char.IsDigit))
                errors.Add("Password must include at least one number.");
            return errors;
        }
    }
}
