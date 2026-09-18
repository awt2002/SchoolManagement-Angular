using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Features.AcademicYears.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/academic-years")]
    [Authorize(Roles = "Admin")]
    public class AcademicYearsController : ControllerBase
    {
        private readonly IAcademicYearService _svc;

        public AcademicYearsController(IAcademicYearService svc) { _svc = svc; }

        [HttpGet]
        public async Task<IActionResult> GetAll() => (await _svc.GetAllAsync()).ToActionResult();

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAcademicYearDto dto)
            => (await _svc.CreateAsync(dto)).ToActionResult();

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcademicYearDto dto)
            => (await _svc.UpdateAsync(id, dto)).ToActionResult();

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(Guid id)
            => (await _svc.ActivateAsync(id)).ToActionResult();

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _svc.DeleteAsync(id)).ToActionResult();
    }
}
