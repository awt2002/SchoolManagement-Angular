using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.API.Middleware;
using SMS.Application.Features.Exams.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/exams")]
    [Authorize]
    public class ExamsController : ControllerBase
    {
        private readonly IExamService _examService;
        private readonly ICurrentUser _currentUser;
        private readonly StudentAccessGuard _studentAccessGuard;

        public ExamsController(IExamService examService, ICurrentUser currentUser, StudentAccessGuard studentAccessGuard)
        {
            _examService = examService;
            _currentUser = currentUser;
            _studentAccessGuard = studentAccessGuard;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetAll(
            [FromQuery] Guid? subjectId = null,
            [FromQuery] Guid? classId = null,
            [FromQuery] DateOnly? from = null,
            [FromQuery] DateOnly? to = null)
            => (await _examService.GetExamsAsync(subjectId, classId, from, to)).ToActionResult();

        [HttpPost]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Create([FromBody] CreateExamDto dto)
            => (await _examService.CreateExamAsync(dto, _currentUser.UserId)).ToActionResult();

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetById(Guid id)
            => (await _examService.GetExamByIdAsync(id)).ToActionResult();

        [HttpPut("{id}")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateExamDto dto)
            => (await _examService.UpdateExamAsync(id, dto)).ToActionResult();

        [HttpGet("{id}/results")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> GetResults(Guid id)
            => (await _examService.GetExamResultsAsync(id)).ToActionResult();

        [HttpPost("{id}/results")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> CreateResults(Guid id, [FromBody] BulkExamResultDto dto)
            => (await _examService.CreateExamResultsAsync(id, dto, _currentUser.UserId)).ToActionResult();

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _examService.DeleteExamAsync(id)).ToActionResult();

        [HttpGet("{id}/results/{studentId}")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetStudentResult(Guid id, Guid studentId)
        {
            var access = await _studentAccessGuard.EvaluateAsync(studentId);
            if (!access.Allowed)
                return access.ToErrorResult<ExamResultDetailDto>().ToActionResult();

            return (await _examService.GetStudentExamResultAsync(id, access.EffectiveStudentId!.Value)).ToActionResult();
        }
    }
}
