using SMS.Application.Common;
using SMS.Application.Interfaces;
using SMS.Domain.Enums;

namespace SMS.API.Middleware
{
    public class StudentAccessGuard
    {
        private readonly IStudentQueryService _students;
        private readonly ICurrentUser _currentUser;

        public StudentAccessGuard(IStudentQueryService students, ICurrentUser currentUser)
        {
            _students = students;
            _currentUser = currentUser;
        }

        public async Task<StudentAccessResult> EvaluateAsync(Guid? requestedStudentId)
        {
            if (_currentUser.Role != UserRole.Student)
            {
                return StudentAccessResult.Allow(requestedStudentId);
            }

            var myProfile = await _students.GetByUserIdAsync(_currentUser.UserId);
            if (!myProfile.IsSuccess || myProfile.Value == null)
            {
                return StudentAccessResult.Deny(myProfile.Kind, myProfile.Message);
            }

            if (requestedStudentId.HasValue && requestedStudentId.Value != myProfile.Value.Id)
            {
                return StudentAccessResult.Deny(ResultKind.Forbidden, "Forbidden");
            }

            return StudentAccessResult.Allow(myProfile.Value.Id);
        }
    }

    public class StudentAccessResult
    {
        public bool Allowed { get; }
        public Guid? EffectiveStudentId { get; }
        public ResultKind ErrorKind { get; }
        public string ErrorMessage { get; }

        public int ErrorStatusCode => ErrorKind switch
        {
            ResultKind.NotFound => 404,
            ResultKind.Forbidden => 403,
            ResultKind.Unauthorized => 401,
            ResultKind.Validation => 400,
            ResultKind.Conflict => 409,
            _ => 500
        };

        private StudentAccessResult(bool allowed, Guid? effectiveStudentId, ResultKind errorKind, string errorMessage)
        {
            Allowed = allowed;
            EffectiveStudentId = effectiveStudentId;
            ErrorKind = errorKind;
            ErrorMessage = errorMessage;
        }

        public static StudentAccessResult Allow(Guid? effectiveStudentId)
            => new(true, effectiveStudentId, ResultKind.Success, string.Empty);

        public static StudentAccessResult Deny(ResultKind kind, string message)
            => new(false, null, kind, message);

        public Result<T> ToErrorResult<T>() => ErrorKind switch
        {
            ResultKind.NotFound => Result<T>.NotFound(ErrorMessage),
            ResultKind.Forbidden => Result<T>.Forbidden(ErrorMessage),
            ResultKind.Unauthorized => Result<T>.Unauthorized(ErrorMessage),
            _ => Result<T>.Validation(ErrorMessage)
        };
    }
}
