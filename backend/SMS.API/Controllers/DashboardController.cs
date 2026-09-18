using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Interfaces;
using SMS.Domain.Enums;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;
        private readonly ICurrentUser _currentUser;

        public DashboardController(IDashboardService dashboardService, ICurrentUser currentUser)
        {
            _dashboardService = dashboardService;
            _currentUser = currentUser;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetDashboard()
        {
            var userId = _currentUser.UserId;

            return _currentUser.Role switch
            {
                UserRole.Admin => (await _dashboardService.GetAdminDashboardAsync(userId)).ToActionResult(),
                UserRole.Teacher => (await _dashboardService.GetTeacherDashboardAsync(userId)).ToActionResult(),
                _ => (await _dashboardService.GetStudentDashboardAsync(userId)).ToActionResult()
            };
        }
    }
}
