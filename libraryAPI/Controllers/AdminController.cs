using LibraryAPI.Models;
using LibraryAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _service;

    public AdminController(IAdminService service)
    {
        _service = service;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var dashboard = await _service.GetDashboardAsync();

        return Ok(dashboard);
    }

    [HttpGet("books")]
    public async Task<IActionResult> GetBooks()
    {
        var books = await _service.GetBooksAsync();

        return Ok(books);
    }

    [HttpPost("books")]
    public async Task<IActionResult> AddBook(BookRequest request)
    {
        if (request.TotalCopies < 0 ||
            request.AvailableCopies < 0)
        {
            return BadRequest(new
            {
                message = "Copy counts cannot be negative."
            });
        }

        if (request.AvailableCopies > request.TotalCopies)
        {
            return BadRequest(new
            {
                message = "Available copies cannot exceed total copies."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Isbn))
        {
            return BadRequest(new
            {
                message = "ISBN is required."
            });
        }

        try
        {
            var bookId = await _service.AddBookAsync(request);

            return Ok(new
            {
                message = "Book added successfully.",
                bookId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPut("books/{bookId:guid}")]
    public async Task<IActionResult> UpdateBook(
    Guid bookId,
    BookRequest request)
    {
        if (request.TotalCopies < 0 ||
            request.AvailableCopies < 0)
        {
            return BadRequest(new
            {
                message = "Copy counts cannot be negative."
            });
        }

        if (request.AvailableCopies > request.TotalCopies)
        {
            return BadRequest(new
            {
                message = "Available copies cannot exceed total copies."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Isbn))
        {
            return BadRequest(new
            {
                message = "ISBN is required."
            });
        }

        try
        {
            var updated = await _service.UpdateBookAsync(
                bookId,
                request
            );

            if (!updated)
            {
                return NotFound(new
                {
                    message = "Book not found."
                });
            }

            return Ok(new
            {
                message = "Book updated successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpDelete("books/{bookId:guid}")]
    public async Task<IActionResult> DeleteBook(Guid bookId)
    {
        var deleted = await _service.DeleteBookAsync(bookId);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Book not found."
            });
        }

        return Ok(new
        {
            message = "Book deleted successfully."
        });
    }
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetCategoriesAsync();

        return Ok(categories);
    }
    [HttpPost("categories")]
    public async Task<IActionResult> AddCategory(
        CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryName))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        try
        {
            var categoryId =
                await _service.AddCategoryAsync(request);

            return Ok(new
            {
                message = "Category added successfully.",
                categoryId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
    [HttpPut("categories/{categoryId:guid}")]
    public async Task<IActionResult> UpdateCategory(
    Guid categoryId,
    CategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CategoryName))
        {
            return BadRequest(new
            {
                message = "Category name is required."
            });
        }

        var updated =
            await _service.UpdateCategoryAsync(
                categoryId,
                request
            );

        if (!updated)
        {
            return NotFound(new
            {
                message = "Category not found."
            });
        }

        return Ok(new
        {
            message = "Category updated successfully."
        });
    }
    [HttpDelete("categories/{categoryId:guid}")]
    public async Task<IActionResult> DeleteCategory(
    Guid categoryId)
    {
        try
        {
            var deleted =
                await _service.DeleteCategoryAsync(
                    categoryId
                );

            if (!deleted)
            {
                return NotFound(new
                {
                    message = "Category not found."
                });
            }

            return Ok(new
            {
                message = "Category deleted successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _service.GetUsersAsync();

        return Ok(users);
    }
    [HttpPut("users/{userId:guid}/status")]
    public async Task<IActionResult> UpdateUserStatus(
    Guid userId,
    UserStatusRequest request)
    {
        try
        {
            var updated =
                await _service.UpdateUserStatusAsync(
                    userId,
                    request.IsActive
                );

            if (!updated)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(new
            {
                message = request.IsActive
                    ? "User activated successfully."
                    : "User deactivated successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
    [HttpGet("borrowings")]
    public async Task<IActionResult> GetBorrowings()
    {
        var borrowings =
            await _service.GetBorrowingsAsync();

        return Ok(borrowings);
    }
    [HttpPost("borrowings")]
    public async Task<IActionResult> BorrowBook(
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] BorrowBookRequest? request = null,
        [FromQuery] Guid? userId = null,
        [FromQuery] Guid? bookId = null,
        [FromQuery] DateTime? dueDate = null)
    {
        var targetUserId = request != null && request.UserId != Guid.Empty
            ? request.UserId
            : (userId.HasValue && userId.Value != Guid.Empty ? userId.Value : Guid.Empty);

        var targetBookId = request != null && request.BookId != Guid.Empty
            ? request.BookId
            : (bookId.HasValue && bookId.Value != Guid.Empty ? bookId.Value : Guid.Empty);

        var targetDueDate = request != null && request.DueDate != default
            ? request.DueDate
            : (dueDate.HasValue && dueDate.Value != default ? dueDate.Value : DateTime.UtcNow.AddDays(14));

        if (targetUserId == Guid.Empty && HttpContext.Request.HasFormContentType)
        {
            if (Guid.TryParse(HttpContext.Request.Form["userId"], out var fUserId)) targetUserId = fUserId;
            if (Guid.TryParse(HttpContext.Request.Form["bookId"], out var fBookId)) targetBookId = fBookId;
            if (DateTime.TryParse(HttpContext.Request.Form["dueDate"], out var fDate)) targetDueDate = fDate;
        }

        if (targetUserId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "User is required."
            });
        }

        if (targetBookId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Book is required."
            });
        }

        if (targetDueDate <= DateTime.UtcNow)
        {
            return BadRequest(new
            {
                message = "Due date must be in the future."
            });
        }

        try
        {
            var borrowingId =
                await _service.BorrowBookAsync(new BorrowBookRequest
                {
                    UserId = targetUserId,
                    BookId = targetBookId,
                    DueDate = targetDueDate
                });

            return Ok(new
            {
                message = "Book borrowed successfully.",
                borrowingId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }
    [HttpPut("borrowings/{borrowingId:guid}/return")]
    public async Task<IActionResult> ReturnBook(
    Guid borrowingId)
    {
        var returned =
            await _service.ReturnBookAsync(
                borrowingId
            );

        if (!returned)
        {
            return BadRequest(new
            {
                message =
                    "Borrowing not found or book already returned."
            });
        }

        return Ok(new
        {
            message = "Book returned successfully."
        });
    }

    [HttpPost("users")]
    public async Task<IActionResult> AddUser(
    [FromBody] AddUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return BadRequest(new
            {
                message = "Username is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Name is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new
            {
                message = "Email is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new
            {
                message = "Password is required."
            });
        }

        if (request.Password.Length < 6)
        {
            return BadRequest(new
            {
                message =
                    "Password must contain at least 6 characters."
            });
        }

        if (string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(new
            {
                message = "Role is required."
            });
        }

        try
        {
            var userId =
                await _service.AddUserAsync(request);

            return Ok(new
            {
                message = "User added successfully.",
                userId
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpPost("borrowings/{borrowingId:guid}/notify")]
    public async Task<IActionResult> NotifyReturn(
    Guid borrowingId)
    {
        var created =
            await _service
                .CreateReturnNotificationAsync(
                    borrowingId
                );

        if (!created)
        {
            return BadRequest(new
            {
                message =
                    "Notification could not be created. The borrowing may already have an unread notification or the book may already be returned."
            });
        }

        return Ok(new
        {
            message =
                "Return notification sent successfully."
        });
    }

    [HttpPost("users/{userId:guid}/notify")]
    public async Task<IActionResult> SendUserNotification(
    Guid userId,
    [FromBody] UserNotificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new
            {
                message = "Notification message is required."
            });
        }

        try
        {
            var sent =
                await _service.SendUserNotificationAsync(
                    userId,
                    request.Message
                );

            if (!sent)
            {
                return NotFound(new
                {
                    message = "User not found or inactive."
                });
            }

            return Ok(new
            {
                message = "Notification sent successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        var deleted =
            await _service.DeleteUserAsync(userId);

        if (!deleted)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(new
        {
            message = "User deleted successfully."
        });
    }
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var notifications =
            await _service.GetNotificationsAsync();

        return Ok(notifications);
    }
    [HttpPut("notifications/{notificationId:guid}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(
    Guid notificationId)
    {
        var updated =
            await _service.MarkNotificationAsReadAsync(
                notificationId
            );

        if (!updated)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }

        return Ok(new
        {
            message = "Notification marked as read."
        });
    }

    [HttpPut("notifications/{notificationId:guid}/unread")]
    public async Task<IActionResult> MarkNotificationAsUnread(
        Guid notificationId)
    {
        var updated =
            await _service.MarkNotificationAsUnreadAsync(
                notificationId
            );

        if (!updated)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }

        return Ok(new
        {
            message = "Notification marked as unread."
        });
    }

    [HttpDelete("notifications/{notificationId:guid}")]
    public async Task<IActionResult> DeleteNotification(
        Guid notificationId)
    {
        var deleted =
            await _service.DeleteNotificationAsync(
                notificationId
            );

        if (!deleted)
        {
            return NotFound(new
            {
                message = "Notification not found."
            });
        }

        return Ok(new
        {
            message = "Notification deleted successfully."
        });
    }
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments()
    {
        var payments =
            await _service.GetAdminPaymentsAsync();

        return Ok(payments);
    }

    [HttpGet("wallet")]
    public async Task<IActionResult> GetAdminWallet()
    {
        var wallet =
            await _service.GetAdminWalletAsync();

        if (wallet == null)
        {
            return NotFound(new
            {
                message = "Admin wallet not found."
            });
        }

        return Ok(wallet);
    }


}