namespace SMS.Application.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// Sends an email, returning false instead of throwing when delivery fails.
        /// Every caller treats mail as best-effort, so this is the only way in.
        /// </summary>
        Task<bool> TrySendEmailAsync(string to, string subject, string body);
    }
}
