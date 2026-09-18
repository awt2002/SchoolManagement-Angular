using SMS.Application.Common;
using SMS.Application.Features.Subjects.DTOs;

namespace SMS.Application.Interfaces
{
    public interface ISubjectService
    {
        Task<Result<List<SubjectDto>>> GetSubjectsAsync(Guid? classId);
        Task<Result<SubjectDto>> CreateSubjectAsync(CreateSubjectDto dto);
        Task<Result<SubjectDto>> GetSubjectByIdAsync(Guid id);
        Task<Result<SubjectDto>> UpdateSubjectAsync(Guid id, UpdateSubjectDto dto);
        Task<Result<Unit>> DeleteSubjectAsync(Guid id);
        Task<Result<List<GradeCategoryDto>>> GetCategoriesAsync(Guid subjectId);
        Task<Result<GradeCategoryDto>> CreateCategoryAsync(Guid subjectId, CreateGradeCategoryDto dto);
        Task<Result<GradeCategoryDto>> UpdateCategoryAsync(Guid subjectId, Guid categoryId, UpdateGradeCategoryDto dto);
        Task<Result<Unit>> DeleteCategoryAsync(Guid subjectId, Guid categoryId);
    }
}
