using System.Net;
using System.Text.Json;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;

namespace SMS.API.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred");

                if (context.Response.HasStarted)
                {
                    throw;
                }

                await HandleExceptionAsync(context, ex);
            }
        }

        private static (int Status, string Message)? ClassifyConstraintViolation(Exception exception)
        {
            if (exception is not DbUpdateException dbUpdate) return null;
            if (dbUpdate.InnerException is not SqlException sql) return null;

            return sql.Number switch
            {
                547 => (409, "The request refers to a record that does not exist, "
                             + "or to one that is still in use."),
                2601 or 2627 => (409, "A record with these details already exists."),
                _ => null
            };
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var constraint = ClassifyConstraintViolation(exception);

            context.Response.Clear();
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = constraint?.Status ?? (int)HttpStatusCode.InternalServerError;

            var response = new BaseResponse<object>
            {
                Success = false,
                Message = constraint?.Message ?? "An internal server error occurred",
                Errors = new List<string>(),
                StatusCode = context.Response.StatusCode
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
