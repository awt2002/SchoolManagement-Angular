using Microsoft.AspNetCore.Mvc;
using SMS.Application.Common;

namespace SMS.API.Extensions
{
    public static class ResultExtensions
    {
        public static IActionResult ToActionResult<T>(this Result<T> result)
        {
            var status = StatusCodeFor(result.Kind);
            var body = new BaseResponse<T>
            {
                Success = result.IsSuccess,
                Message = result.Message,
                Data = result.IsSuccess ? result.Value : default,
                Errors = result.Errors.ToList(),
                StatusCode = status
            };
            return new ObjectResult(body) { StatusCode = status };
        }

        public static IActionResult ToPagedActionResult<T>(this Result<PagedList<T>> result)
        {
            var status = StatusCodeFor(result.Kind);
            if (!result.IsSuccess || result.Value is null)
            {
                var errorBody = new BaseResponse<List<T>>
                {
                    Success = false,
                    Message = result.Message,
                    Data = null,
                    Errors = result.Errors.ToList(),
                    StatusCode = status
                };
                return new ObjectResult(errorBody) { StatusCode = status };
            }

            var page = result.Value;
            var body = new PagedResponse<T>
            {
                Success = true,
                Message = result.Message,
                Data = page.Items,
                Errors = new List<string>(),
                StatusCode = status,
                Page = page.Page,
                PageSize = page.PageSize,
                TotalCount = page.TotalCount
            };
            return new ObjectResult(body) { StatusCode = status };
        }

        private static int StatusCodeFor(ResultKind kind) => kind switch
        {
            ResultKind.Success => 200,
            ResultKind.Created => 201,
            ResultKind.Validation => 400,
            ResultKind.Unauthorized => 401,
            ResultKind.Forbidden => 403,
            ResultKind.NotFound => 404,
            ResultKind.Conflict => 409,
            _ => 500
        };
    }
}
