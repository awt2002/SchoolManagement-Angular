using FluentValidation;
using SMS.Application.Features.Students.DTOs;

namespace SMS.Application.Features.Students.Validators
{
    public class UpdateStudentDtoValidator : AbstractValidator<UpdateStudentDto>
    {
        public UpdateStudentDtoValidator()
        {
            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("FullName is required.")
                .MaximumLength(100).WithMessage("FullName must not exceed 100 characters.");

            RuleFor(x => x.Address)
                .MaximumLength(250).WithMessage("Address must not exceed 250 characters.");

            RuleFor(x => x.DateOfBirth)
                .Must(dob => dob <= DateOnly.FromDateTime(DateTime.UtcNow))
                .WithMessage("Date of birth cannot be in the future.");

            RuleFor(x => x.ParentEmail)
                .EmailAddress().WithMessage("ParentEmail must be a valid email address.")
                .When(x => !string.IsNullOrWhiteSpace(x.ParentEmail));
        }
    }
}
