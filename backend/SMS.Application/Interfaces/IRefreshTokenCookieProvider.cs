namespace SMS.Application.Interfaces
{
    public interface IRefreshTokenCookieProvider
    {
        string? Read();
        void Write(string token, DateTime expires);
        void Clear();
    }
}
