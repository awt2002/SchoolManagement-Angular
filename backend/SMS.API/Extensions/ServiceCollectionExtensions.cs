using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FluentValidation;
using SMS.Application.Features.Attendance.DTOs;
using SMS.Application.Features.Attendance.Validators;
using SMS.Application.Features.Grades.DTOs;
using SMS.Application.Features.Grades.Validators;
using SMS.Application.Features.Students.DTOs;
using SMS.Application.Features.Students.Validators;
using SMS.Application.Interfaces;
using SMS.Infrastructure.Data;
using SMS.Infrastructure.Seed;
using SMS.Infrastructure.Services;
using SMS.API.Middleware;

namespace SMS.API.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("Default"),
                    sqlOptions => sqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

            // Services
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IStudentQueryService, StudentQueryService>();
            services.AddScoped<IStudentCommandService, StudentCommandService>();
            services.AddScoped<ITeacherService, TeacherService>();
            services.AddScoped<IClassQueryService, ClassQueryService>();
            services.AddScoped<IClassCommandService, ClassCommandService>();
            services.AddScoped<IAcademicYearService, AcademicYearService>();
            services.AddScoped<IAttendanceService, AttendanceService>();
            services.AddScoped<ISubjectService, SubjectService>();
            services.AddScoped<IGradeService, GradeService>();
            services.AddScoped<IExamService, ExamService>();
            services.AddScoped<IAnnouncementService, AnnouncementService>();
            services.AddScoped<IDashboardService, DashboardService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<ICurrentUser, CurrentUser>();
            services.AddScoped<IRefreshTokenCookieProvider, RefreshTokenCookieProvider>();
            services.AddScoped<StudentAccessGuard>();

            // Validators
            services.AddScoped<IValidator<CreateStudentDto>, CreateStudentDtoValidator>();
            services.AddScoped<IValidator<UpdateStudentDto>, UpdateStudentDtoValidator>();
            services.AddScoped<IValidator<CreateGradeDto>, CreateGradeDtoValidator>();
            services.AddScoped<IValidator<CreateAttendanceDto>, CreateAttendanceDtoValidator>();
            services.AddScoped<DatabaseSeeder>();

            // JWT
            var jwtSecret = configuration["Jwt:Secret"] ?? "SuperSecretKeyThatIsLongEnoughForHmacSha256Algorithm!";
            var key = Encoding.UTF8.GetBytes(jwtSecret);

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"] ?? "SMS",
                    ValidAudience = configuration["Jwt:Audience"] ?? "SMS",
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                };
            });

            services.AddAuthorization();

            services.AddRateLimiter(options =>
            {
                options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
                options.AddFixedWindowLimiter("auth", opt =>
                {
                    opt.PermitLimit = 5;
                    opt.Window = TimeSpan.FromMinutes(1);
                    opt.QueueLimit = 0;
                });
            });

            return services;
        }
    }
}
