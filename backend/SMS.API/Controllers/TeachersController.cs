using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Common;
using SMS.Application.Features.Teachers.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/teachers")]
    [Authorize(Roles = "Admin,Teacher")]
    public class TeachersController : ControllerBase
    {
        private readonly ITeacherService _teacherService;
        private readonly ICurrentUser _currentUser;

        public TeachersController(ITeacherService teacherService, ICurrentUser currentUser)
        {
            _teacherService = teacherService;
            _currentUser = currentUser;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? search = null,
            [FromQuery] bool includeInactive = false,
            [FromQuery] bool inactiveOnly = false)
            => (await _teacherService.GetAllTeachersAsync(page, pageSize, search, includeInactive, inactiveOnly))
                .ToPagedActionResult();

        [HttpGet("me")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetMe()
        {
            if (_currentUser.UserId == Guid.Empty)
                return Result<TeacherDto>.Unauthorized().ToActionResult();

            return (await _teacherService.GetTeacherByUserIdAsync(_currentUser.UserId)).ToActionResult();
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateTeacherDto dto)
        {
            var errors = new List<string>();
            if (string.IsNullOrEmpty(dto.Username) || dto.Username.Length < 4 || dto.Username.Length > 20)
                errors.Add("Username must be 4-20 characters and contain only letters and numbers.");
            if (!System.Net.Mail.MailAddress.TryCreate(dto.Email, out _))
                errors.Add("Please enter a valid email address.");

            if (errors.Count > 0)
                return Result<TeacherDto>.Validation("Validation failed", errors.ToArray()).ToActionResult();

            return (await _teacherService.CreateTeacherAsync(dto)).ToActionResult();
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetById(Guid id)
            => (await _teacherService.GetTeacherByIdAsync(id)).ToActionResult();

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateTeacherDto dto)
            => (await _teacherService.UpdateTeacherAsync(id, dto)).ToActionResult();

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _teacherService.DeleteTeacherAsync(id)).ToActionResult();

        [HttpPut("{id}/reactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reactivate(Guid id)
            => (await _teacherService.ReactivateTeacherAsync(id)).ToActionResult();
    }
}
