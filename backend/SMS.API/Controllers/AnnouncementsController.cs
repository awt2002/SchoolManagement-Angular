using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.API.Extensions;
using SMS.Application.Features.Announcements.DTOs;
using SMS.Application.Interfaces;

namespace SMS.API.Controllers
{
    [ApiController]
    [Route("api/v1/announcements")]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IAnnouncementService _announcementService;
        private readonly ICurrentUser _currentUser;

        public AnnouncementsController(IAnnouncementService announcementService, ICurrentUser currentUser)
        {
            _announcementService = announcementService;
            _currentUser = currentUser;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
            => (await _announcementService.GetAnnouncementsAsync(
                _currentUser.UserId, _currentUser.Role.ToString(), page, pageSize)).ToPagedActionResult();

        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Create([FromBody] Application.Features.Announcements.DTOs.CreateAnnouncementDto dto)
            => (await _announcementService.CreateAnnouncementAsync(dto, _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetById(Guid id)
            => (await _announcementService.GetAnnouncementByIdAsync(
                id, _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();

        [HttpPost("{id}/read")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> MarkAsRead(Guid id)
            => (await _announcementService.MarkAsReadAsync(
                id, _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAnnouncementDto dto)
            => (await _announcementService.UpdateAnnouncementAsync(id, dto, _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> Delete(Guid id)
            => (await _announcementService.DeleteAnnouncementAsync(id, _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();

        [HttpGet("unread-count")]
        [Authorize(Roles = "Admin,Teacher,Student")]
        public async Task<IActionResult> GetUnreadCount()
            => (await _announcementService.GetUnreadCountAsync(
                _currentUser.UserId, _currentUser.Role.ToString())).ToActionResult();
    }
}
