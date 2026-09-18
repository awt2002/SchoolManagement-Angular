using Microsoft.EntityFrameworkCore;
using SMS.Application.Common;
using SMS.Application.Features.AcademicYears.DTOs;
using SMS.Application.Interfaces;
using SMS.Domain.Entities;
using SMS.Infrastructure.Data;

namespace SMS.Infrastructure.Services
{
    public class AcademicYearService : IAcademicYearService
    {
        private readonly AppDbContext _context;

        public AcademicYearService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Result<List<AcademicYearDto>>> GetAllAsync()
        {
            var years = await _context.AcademicYears
                .OrderByDescending(a => a.StartDate)
                .Select(a => new AcademicYearDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    StartDate = a.StartDate,
                    EndDate = a.EndDate,
                    IsActive = a.IsActive
                })
                .ToListAsync();

            return Result<List<AcademicYearDto>>.Ok(years, "Academic years retrieved");
        }

        public async Task<Result<AcademicYearDto>> CreateAsync(CreateAcademicYearDto dto)
        {
            var academicYear = new AcademicYear
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                IsActive = false
            };

            _context.AcademicYears.Add(academicYear);
            await _context.SaveChangesAsync();

            return Result<AcademicYearDto>.Created(MapDto(academicYear));
        }

        public async Task<Result<AcademicYearDto>> UpdateAsync(Guid id, UpdateAcademicYearDto dto)
        {
            var academicYear = await _context.AcademicYears.FindAsync(id);
            if (academicYear == null)
            {
                return Result<AcademicYearDto>.NotFound("Academic year not found");
            }

            academicYear.Name = dto.Name;
            academicYear.StartDate = dto.StartDate;
            academicYear.EndDate = dto.EndDate;

            await _context.SaveChangesAsync();
            return Result<AcademicYearDto>.Ok(MapDto(academicYear), "Academic year updated");
        }

        public async Task<Result<AcademicYearDto>> ActivateAsync(Guid id)
        {
            var academicYear = await _context.AcademicYears.FindAsync(id);
            if (academicYear == null)
            {
                return Result<AcademicYearDto>.NotFound("Academic year not found");
            }

            var allYears = await _context.AcademicYears.ToListAsync();
            foreach (var year in allYears) year.IsActive = false;
            academicYear.IsActive = true;
            await _context.SaveChangesAsync();

            return Result<AcademicYearDto>.Ok(MapDto(academicYear), "Academic year activated");
        }

        public async Task<Result<Unit>> DeleteAsync(Guid id)
        {
            var year = await _context.AcademicYears.FindAsync(id);
            if (year == null) return Result<Unit>.NotFound("Academic year not found");

            var hasClasses = await _context.Classes.AnyAsync(c => c.AcademicYearId == id);
            if (hasClasses)
                return Result<Unit>.Conflict("Cannot delete an academic year that has classes assigned to it");

            _context.AcademicYears.Remove(year);
            await _context.SaveChangesAsync();
            return Result<Unit>.Ok(Unit.Value, "Academic year deleted");
        }

        private static AcademicYearDto MapDto(AcademicYear a) => new()
        {
            Id = a.Id,
            Name = a.Name,
            StartDate = a.StartDate,
            EndDate = a.EndDate,
            IsActive = a.IsActive
        };
    }
}
