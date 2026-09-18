namespace SMS.Application.Common
{
    public enum ResultKind
    {
        Success = 0,
        Created,
        NotFound,
        Conflict,
        Validation,
        Unauthorized,
        Forbidden,
        Unexpected
    }

    public readonly struct Unit
    {
        public static readonly Unit Value = default;
    }

    public sealed class Result<T>
    {
        public ResultKind Kind { get; }
        public T? Value { get; }
        public string Message { get; }
        public IReadOnlyList<string> Errors { get; }

        public bool IsSuccess => Kind == ResultKind.Success || Kind == ResultKind.Created;

        private Result(ResultKind kind, T? value, string message, IReadOnlyList<string>? errors)
        {
            Kind = kind;
            Value = value;
            Message = message;
            Errors = errors ?? Array.Empty<string>();
        }

        public static Result<T> Ok(T value, string message = "OK") =>
            new(ResultKind.Success, value, message, null);

        public static Result<T> Created(T value, string message = "Created") =>
            new(ResultKind.Created, value, message, null);

        public static Result<T> NotFound(string message = "Not found") =>
            new(ResultKind.NotFound, default, message, null);

        public static Result<T> Conflict(string message, params string[] errors) =>
            new(ResultKind.Conflict, default, message, errors);

        public static Result<T> Validation(string message, params string[] errors) =>
            new(ResultKind.Validation, default, message, errors);

        public static Result<T> Unauthorized(string message = "Unauthorized") =>
            new(ResultKind.Unauthorized, default, message, null);

        public static Result<T> Forbidden(string message = "Forbidden") =>
            new(ResultKind.Forbidden, default, message, null);
    }
}
