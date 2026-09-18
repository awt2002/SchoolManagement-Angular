using SMS.Application.Interfaces;

namespace SMS.API.Middleware
{
    public class RefreshTokenCookieProvider : IRefreshTokenCookieProvider
    {
        private const string CookieName = "refreshToken";
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RefreshTokenCookieProvider(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public string? Read()
        {
            return _httpContextAccessor.HttpContext?.Request.Cookies[CookieName];
        }

        public void Write(string token, DateTime expires)
        {
            var response = _httpContextAccessor.HttpContext?.Response;
            if (response == null) return;

            response.Cookies.Append(CookieName, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = expires
            });
        }

        public void Clear()
        {
            var response = _httpContextAccessor.HttpContext?.Response;
            if (response == null) return;

            response.Cookies.Delete(CookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });
        }
    }
}
