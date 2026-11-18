using System.Security.Claims;
using LibraryAPI.Models;
using LibraryAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _service;

    public UserController(IUserService service)
    {
        _service = service;
    }

    // =========================================================
    // DASHBOARD
    // =========================================================

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var dashboard =
            await _service.GetDashboardAsync(userId);

        if (dashboard == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(dashboard);
    }

    // =========================================================
    // BORROWED BOOKS
    // =========================================================

    [HttpGet("borrowed")]
    public async Task<IActionResult> GetBorrowedBooks()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var books =
            await _service.GetBorrowedBooksAsync(userId);

        return Ok(books);
    }

    // =========================================================
    // DUE BOOKS
    // =========================================================

    [HttpGet("due-books")]
    public async Task<IActionResult> GetDueBooks()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var books =
            await _service.GetDueBooksAsync(userId);

        return Ok(books);
    }

    // =========================================================
    // UPCOMING BOOKS
    // =========================================================

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcomingBooks()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var books =
            await _service.GetUpcomingBooksAsync(userId);

        return Ok(books);
    }

    // =========================================================
    // HISTORY
    // =========================================================

    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var history =
            await _service.GetHistoryAsync(userId);

        return Ok(history);
    }

    // =========================================================
    // GET PROFILE
    // =========================================================

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var profile =
            await _service.GetProfileAsync(userId);

        if (profile == null)
        {
            return NotFound(new
            {
                message = "User not found."
            });
        }

        return Ok(profile);
    }

    // =========================================================
    // UPDATE PROFILE NAME
    // =========================================================

    [HttpPut("profile/name")]
    public async Task<IActionResult> UpdateProfileName(
        [FromBody] UpdateProfileNameRequest request)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        if (request == null ||
            string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new
            {
                message = "Name is required."
            });
        }

        if (request.Name.Trim().Length > 100)
        {
            return BadRequest(new
            {
                message =
                    "Name must not exceed 100 characters."
            });
        }

        var updated =
            await _service.UpdateProfileNameAsync(
                userId,
                request.Name.Trim()
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
            message =
                "Name updated successfully."
        });
    }

    // =========================================================
    // RETURN BOOK WITH PAYMENT
    // =========================================================

    [HttpPut("borrowed/{borrowingId:guid}/return")]
    public async Task<IActionResult> ReturnBook(
        Guid borrowingId,
        [FromBody] ReturnBookRequest request)
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        if (request == null ||
            string.IsNullOrWhiteSpace(request.PaymentMethod))
        {
            return BadRequest(new
            {
                message =
                    "Payment method is required."
            });
        }

        try
        {
            var returned =
                await _service.ReturnBookAsync(
                    userId,
                    borrowingId,
                    request.PaymentMethod.Trim()
                );

            if (!returned)
            {
                return BadRequest(new
                {
                    message =
                        "Book not found, it does not belong to you, or it has already been returned."
                });
            }

            return Ok(new
            {
                message =
                    "Book returned successfully."
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

    // =========================================================
    // BORROW BOOK
    // =========================================================

    [HttpPost("borrow")]
    [HttpPost("borrow/{bookId:guid}")]
    public async Task<IActionResult> BorrowBook(
        [FromBody(
            EmptyBodyBehavior =
                Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow
        )]
        UserBorrowBookRequest? request = null,
        [FromQuery] Guid? bookId = null,
        [FromRoute] Guid? routeBookId = null)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var targetBookId =
            (request != null &&
             request.BookId != Guid.Empty)
                ? request.BookId
                : (bookId.HasValue &&
                   bookId.Value != Guid.Empty
                    ? bookId.Value
                    : (routeBookId.HasValue &&
                       routeBookId.Value != Guid.Empty
                        ? routeBookId.Value
                        : Guid.Empty));

        if (targetBookId == Guid.Empty &&
            HttpContext.Request.HasFormContentType)
        {
            if (Guid.TryParse(
                    HttpContext.Request.Form["bookId"],
                    out var formBookId))
            {
                targetBookId = formBookId;
            }
        }

        if (targetBookId == Guid.Empty)
        {
            return BadRequest(new
            {
                message = "Book ID is required."
            });
        }

        try
        {
            var borrowingId =
                await _service.BorrowBookAsync(
                    userId,
                    targetBookId
                );

            return Ok(new
            {
                message =
                    "Book borrowed successfully.",
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

    // =========================================================
    // CAN BORROW
    // =========================================================

    [HttpGet("can-borrow")]
    public async Task<IActionResult> CanBorrowBooks()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var canBorrow =
            await _service.CanBorrowBooksAsync(
                userId
            );

        return Ok(new
        {
            canBorrow
        });
    }

    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var notifications =
            await _service.GetNotificationsAsync(
                userId
            );

        return Ok(notifications);
    }

    // =========================================================
    // UNREAD NOTIFICATION COUNT
    // =========================================================

    [HttpGet("notifications/unread-count")]
    public async Task<IActionResult> GetUnreadNotificationCount()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var count =
            await _service.GetUnreadNotificationCountAsync(
                userId
            );

        return Ok(new
        {
            count
        });
    }

    // =========================================================
    // MARK NOTIFICATION AS READ
    // =========================================================

    [HttpPut("notifications/{notificationId:guid}/read")]
    public async Task<IActionResult> MarkNotificationAsRead(
        Guid notificationId)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var updated =
            await _service.MarkNotificationAsReadAsync(
                userId,
                notificationId
            );

        if (!updated)
        {
            return NotFound(new
            {
                message =
                    "Notification not found."
            });
        }

        return Ok(new
        {
            message =
                "Notification marked as read."
        });
    }

    // =========================================================
    // MARK NOTIFICATION AS UNREAD
    // =========================================================

    [HttpPut("notifications/{notificationId:guid}/unread")]
    public async Task<IActionResult> MarkNotificationAsUnread(
        Guid notificationId)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var updated =
            await _service.MarkNotificationAsUnreadAsync(
                userId,
                notificationId
            );

        if (!updated)
        {
            return NotFound(new
            {
                message =
                    "Notification not found."
            });
        }

        return Ok(new
        {
            message =
                "Notification marked as unread."
        });
    }

    // =========================================================
    // DELETE NOTIFICATION
    // =========================================================

    [HttpDelete("notifications/{notificationId:guid}")]
    public async Task<IActionResult> DeleteNotification(
        Guid notificationId)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var deleted =
            await _service.DeleteNotificationAsync(
                userId,
                notificationId
            );

        if (!deleted)
        {
            return NotFound(new
            {
                message =
                    "Notification not found."
            });
        }

        return Ok(new
        {
            message =
                "Notification deleted successfully."
        });
    }

    // =========================================================
    // MARK ALL NOTIFICATIONS AS READ
    // =========================================================

    [HttpPut("notifications/read-all")]
    public async Task<IActionResult> MarkAllNotificationsAsRead()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        var updated =
            await _service.MarkAllNotificationsAsReadAsync(
                userId
            );

        return Ok(new
        {
            message = updated
                ? "All notifications marked as read."
                : "No unread notifications found."
        });
    }

    // =========================================================
    // FEEDBACK
    // =========================================================

    [HttpPost("feedback")]
    public async Task<IActionResult> SubmitFeedback(
        [FromBody] FeedbackRequest request)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized();
        }

        if (request == null ||
            string.IsNullOrWhiteSpace(request.Feedback))
        {
            return BadRequest(new
            {
                message = "Feedback is required."
            });
        }

        if (request.Feedback.Trim().Length > 500)
        {
            return BadRequest(new
            {
                message =
                    "Feedback must not exceed 500 characters."
            });
        }

        var submitted =
            await _service.SubmitFeedbackAsync(
                userId,
                request.Feedback
            );

        if (!submitted)
        {
            return BadRequest(new
            {
                message =
                    "Unable to submit feedback."
            });
        }

        return Ok(new
        {
            message =
                "Feedback submitted successfully."
        });
    }

    // =========================================================
    // BOOK AVAILABILITY NOTIFICATION
    // =========================================================

    [HttpPost("notify-availability")]
    public async Task<IActionResult> NotifyBookAvailability(
        [FromBody] NotifyBookAvailabilityRequest request)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdValue,
                out var userId))
        {
            return Unauthorized(new
            {
                message =
                    "User not authenticated."
            });
        }

        if (request == null ||
            request.BookId == Guid.Empty)
        {
            return BadRequest(new
            {
                message =
                    "Book ID is required."
            });
        }

        try
        {
            var created =
                await _service.CreateBookAvailabilityNotificationAsync(
                    userId,
                    request.BookId
                );

            if (!created)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to create notification request."
                });
            }

            return Ok(new
            {
                message =
                    "Admin has been notified successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception)
        {
            return StatusCode(500, new
            {
                message =
                    "Unable to create notification request."
            });
        }
    }

    // =========================================================
    // UPDATE FULL PROFILE
    // =========================================================

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(
        [FromBody] UpdateProfileRequest request)
    {
        try
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!Guid.TryParse(
                    userIdValue,
                    out var userId))
            {
                return Unauthorized(new
                {
                    message =
                        "User not authenticated."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Profile data is required."
                });
            }

            var result =
                await _service.UpdateProfileAsync(
                    userId,
                    request
                );

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to update profile."
                });
            }

            return Ok(new
            {
                message =
                    "Profile updated successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Update Profile Error: {ex}"
            );

            return StatusCode(500, new
            {
                message =
                    "An error occurred while updating the profile."
            });
        }
    }

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    [HttpPut("profile/password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!Guid.TryParse(
                    userIdValue,
                    out var userId))
            {
                return Unauthorized(new
                {
                    message =
                        "User not authenticated."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Password data is required."
                });
            }

            var result =
                await _service.ChangePasswordAsync(
                    userId,
                    request
                );

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to change password."
                });
            }

            return Ok(new
            {
                message =
                    "Password changed successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Change Password Error: {ex}"
            );

            return StatusCode(500, new
            {
                message =
                    "An error occurred while changing the password."
            });
        }
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteAccount(
        [FromBody] DeleteAccountRequest request)
    {
        try
        {
            var userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!Guid.TryParse(
                    userIdValue,
                    out var userId))
            {
                return Unauthorized(new
                {
                    message =
                        "User not authenticated."
                });
            }

            if (request == null)
            {
                return BadRequest(new
                {
                    message =
                        "Delete account data is required."
                });
            }

            var result =
                await _service.DeleteAccountAsync(
                    userId,
                    request
                );

            if (!result)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to delete account."
                });
            }

            return Ok(new
            {
                message =
                    "Account deleted successfully."
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Delete Account Error: {ex}"
            );

            return StatusCode(500, new
            {
                message =
                    "An error occurred while deleting the account."
            });
        }
    }
    // =========================================================
    // LIBRARY CHATBOT
    // =========================================================

    [HttpPost("chatbot")]
    public async Task<IActionResult> Chatbot(
    [FromBody] ChatbotRequest request)
    {
        var userIdClaim =
            User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier
            )?.Value;

        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var response =
            await _service.ChatbotAsync(
                userId,
                request.Message.Trim()
            );

        return Ok(new
        {
            response
        });
    }
}