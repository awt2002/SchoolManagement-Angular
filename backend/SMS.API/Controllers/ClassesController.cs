using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Features.Classes.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/classes")]
    [Authorize]
    public class ClassesController : ControllerBase
    {
        private readonly IClassQueryService _queries;
        private readonly IClassCommandService _commands;

        public ClassesController(IClassQueryService queries, IClassCommandService commands)
        {
            _queries = queries;
            _commands = commands;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetAll(
            [FromQuery] Guid? academicYearId = null,
            [FromQuery] Guid? teacherId = null)
            => (await _queries.GetAllAsync(academicYearId, teacherId)).ToActionResult();

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateClassDto dto)
            => (await _commands.CreateAsync(dto)).ToActionResult();

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetById(Guid id)
            => (await _queries.GetByIdAsync(id)).ToActionResult();

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClassDto dto)
            => (await _commands.UpdateAsync(id, dto)).ToActionResult();

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _commands.DeleteAsync(id)).ToActionResult();

        [HttpPost("{id}/enroll")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> EnrollStudent(Guid id, [FromBody] EnrollStudentDto dto)
            => (await _commands.EnrollStudentAsync(id, dto)).ToActionResult();

        [HttpDelete("{id}/enroll/{studentId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveStudent(Guid id, Guid studentId)
            => (await _commands.RemoveStudentAsync(id, studentId)).ToActionResult();
    }
}
