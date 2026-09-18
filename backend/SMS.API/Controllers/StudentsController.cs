using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.API.Middleware;
using SMS.Application.Common;
using SMS.Application.Features.Students.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/students")]
    [Authorize]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentQueryService _queries;
        private readonly IStudentCommandService _commands;
        private readonly IValidator<CreateStudentDto> _createValidator;
        private readonly IValidator<UpdateStudentDto> _updateValidator;
        private readonly ICurrentUser _currentUser;
        private readonly StudentAccessGuard _studentAccessGuard;

        public StudentsController(
            IStudentQueryService queries,
            IStudentCommandService commands,
            IValidator<CreateStudentDto> createValidator,
            IValidator<UpdateStudentDto> updateValidator,
            ICurrentUser currentUser,
            StudentAccessGuard studentAccessGuard)
        {
            _queries = queries;
            _commands = commands;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _currentUser = currentUser;
            _studentAccessGuard = studentAccessGuard;
        }

        [HttpGet("me")]
        [Authorize(Roles = "Student")]
        public async Task<IActionResult> GetMyProfile()
        {
            if (_currentUser.UserId == Guid.Empty)
                return Result<StudentDetailDto>.Unauthorized().ToActionResult();

            return (await _queries.GetByUserIdAsync(_currentUser.UserId)).ToActionResult();
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] int? gradeLevel = null,
            [FromQuery] Guid? classId = null,
            [FromQuery] Guid? academicYearId = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] bool inactiveOnly = false)
            => (await _queries.GetAllAsync(
                    page, pageSize, search, gradeLevel, classId, academicYearId, includeInactive, inactiveOnly))
                .ToPagedActionResult();

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateStudentDto dto)
        {
            var validation = await _createValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                return Result<StudentDetailDto>.Validation("Validation failed",
                    validation.Errors.Select(e => e.ErrorMessage).ToArray()).ToActionResult();

            return (await _commands.CreateAsync(dto)).ToActionResult();
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var access = await _studentAccessGuard.EvaluateAsync(id);
            if (!access.Allowed)
                return access.ToErrorResult<StudentDetailDto>().ToActionResult();

            return (await _queries.GetByIdAsync(id)).ToActionResult();
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStudentDto dto)
        {
            var validation = await _updateValidator.ValidateAsync(dto);
            if (!validation.IsValid)
                return Result<StudentDetailDto>.Validation("Validation failed",
                    validation.Errors.Select(e => e.ErrorMessage).ToArray()).ToActionResult();

            return (await _commands.UpdateAsync(id, dto)).ToActionResult();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _commands.DeleteAsync(id)).ToActionResult();

        [HttpPut("{id}/reactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reactivate(Guid id)
            => (await _commands.ReactivateAsync(id)).ToActionResult();

        [HttpGet("{id}/enrollments")]
        [Authorize(Roles = "Admin,Student")]
        public async Task<IActionResult> GetEnrollments(Guid id)
        {
            var access = await _studentAccessGuard.EvaluateAsync(id);
            if (!access.Allowed)
                return access.ToErrorResult<List<EnrollmentDto>>().ToActionResult();

            return (await _queries.GetEnrollmentsAsync(id)).ToActionResult();
        }
    }
}
