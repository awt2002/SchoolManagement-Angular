using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Features.Subjects.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/subjects")]
    [Authorize]
    public class SubjectsController : ControllerBase
    {
        private readonly ISubjectService _subjectService;

        public SubjectsController(ISubjectService subjectService)
        {
            _subjectService = subjectService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetAll([FromQuery] Guid? classId = null)
            => (await _subjectService.GetSubjectsAsync(classId)).ToActionResult();

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromBody] CreateSubjectDto dto)
            => (await _subjectService.CreateSubjectAsync(dto)).ToActionResult();

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetById(Guid id)
            => (await _subjectService.GetSubjectByIdAsync(id)).ToActionResult();

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateSubjectDto dto)
            => (await _subjectService.UpdateSubjectAsync(id, dto)).ToActionResult();

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _subjectService.DeleteSubjectAsync(id)).ToActionResult();

        [HttpGet("{subjectId}/categories")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetCategories(Guid subjectId)
            => (await _subjectService.GetCategoriesAsync(subjectId)).ToActionResult();

        [HttpPost("{subjectId}/categories")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateCategory(Guid subjectId, [FromBody] CreateGradeCategoryDto dto)
            => (await _subjectService.CreateCategoryAsync(subjectId, dto)).ToActionResult();

        [HttpPut("{subjectId}/categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateCategory(Guid subjectId, Guid id, [FromBody] UpdateGradeCategoryDto dto)
            => (await _subjectService.UpdateCategoryAsync(subjectId, id, dto)).ToActionResult();

        [HttpDelete("{subjectId}/categories/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(Guid subjectId, Guid id)
            => (await _subjectService.DeleteCategoryAsync(subjectId, id)).ToActionResult();
    }
}
