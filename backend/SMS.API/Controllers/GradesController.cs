using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.API.Middleware;
using SMS.Application.Common;
using SMS.Application.Features.Grades.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/grades")]
    [Authorize]
    public class GradesController : ControllerBase
    {
        private readonly IGradeService _gradeService;
        private readonly IValidator<CreateGradeDto> _createGradeValidator;
        private readonly ICurrentUser _currentUser;
        private readonly StudentAccessGuard _studentAccessGuard;

        public GradesController(
            IGradeService gradeService,
            IValidator<CreateGradeDto> createGradeValidator,
            ICurrentUser currentUser,
            StudentAccessGuard studentAccessGuard)
        {
            _gradeService = gradeService;
            _createGradeValidator = createGradeValidator;
            _currentUser = currentUser;
            _studentAccessGuard = studentAccessGuard;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetAll(
            [FromQuery] Guid? subjectId = null,
            [FromQuery] Guid? studentId = null,
            [FromQuery] Guid? academicYearId = null)
        {
            var access = await _studentAccessGuard.EvaluateAsync(studentId);
            if (!access.Allowed)
                return access.ToErrorResult<List<GradeDto>>().ToActionResult();

            return (await _gradeService.GetGradesAsync(subjectId, access.EffectiveStudentId, academicYearId)).ToActionResult();
        }

        [HttpPost]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Create([FromBody] CreateGradeDto dto)
        {
            var validationResult = await _createGradeValidator.ValidateAsync(dto);
            if (!validationResult.IsValid)
                return Result<GradeDto>.Validation("Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToArray()).ToActionResult();

            return (await _gradeService.CreateOrUpdateGradeAsync(dto, _currentUser.UserId)).ToActionResult();
        }

        [HttpGet("summary")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetSummary(
            [FromQuery] Guid? studentId = null,
            [FromQuery] Guid? classId = null,
            [FromQuery] Guid? academicYearId = null)
        {
            var access = await _studentAccessGuard.EvaluateAsync(studentId);
            if (!access.Allowed)
                return access.ToErrorResult<GradeSummaryDto>().ToActionResult();

            return (await _gradeService.GetGradeSummaryAsync(access.EffectiveStudentId, classId, academicYearId)).ToActionResult();
        }

        [HttpGet("audit")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAuditLog(
            [FromQuery] Guid? studentId = null,
            [FromQuery] Guid? subjectId = null,
            [FromQuery] DateOnly? from = null,
            [FromQuery] DateOnly? to = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
            => (await _gradeService.GetAuditLogAsync(studentId, subjectId, from, to, page, pageSize))
                .ToPagedActionResult();
    }
}
