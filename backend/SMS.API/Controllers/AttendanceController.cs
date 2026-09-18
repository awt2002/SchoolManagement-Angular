using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.API.Middleware;
using SMS.Application.Common;
using SMS.Application.Features.Attendance.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/attendance")]
    [Authorize]
    public class AttendanceController : ControllerBase
    {
        private readonly IAttendanceService _attendanceService;
        private readonly IValidator<CreateAttendanceDto> _createValidator;
        private readonly ICurrentUser _currentUser;
        private readonly StudentAccessGuard _studentAccessGuard;

        public AttendanceController(
            IAttendanceService attendanceService,
            IValidator<CreateAttendanceDto> createValidator,
            ICurrentUser currentUser,
            StudentAccessGuard studentAccessGuard)
        {
            _attendanceService = attendanceService;
            _createValidator = createValidator;
            _currentUser = currentUser;
            _studentAccessGuard = studentAccessGuard;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll(
            [FromQuery] Guid? classId = null,
            [FromQuery] Guid? studentId = null,
            [FromQuery] DateOnly? from = null,
            [FromQuery] DateOnly? to = null)
            => (await _attendanceService.GetAttendanceAsync(classId, studentId, from, to)).ToActionResult();

        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Create([FromBody] CreateAttendanceDto dto)
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                return Result<AttendanceRecordDto>.Validation("Validation failed",
                    validation.Errors.Select(e => e.ErrorMessage).ToArray()).ToActionResult();

            return (await _attendanceService.CreateAttendanceAsync(dto, _currentUser.UserId)).ToActionResult();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _attendanceService.DeleteAttendanceAsync(id)).ToActionResult();

        [HttpGet("student/{studentId}/summary")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetStudentSummary(
            Guid studentId,
            [FromQuery] Guid? academicYearId = null)
        {
            var access = await _studentAccessGuard.EvaluateAsync(studentId);
            if (!access.Allowed)
                return access.ToErrorResult<AttendanceSummaryDto>().ToActionResult();

            return (await _attendanceService.GetStudentSummaryAsync(
                access.EffectiveStudentId ?? studentId, academicYearId)).ToActionResult();
        }
    }
}
