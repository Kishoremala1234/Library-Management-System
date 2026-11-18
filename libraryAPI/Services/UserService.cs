using LibraryAPI.Models;
using LibraryAPI.Repositories;

namespace LibraryAPI.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _repository;

    public UserService(IUserRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserDashboardResponse?> GetDashboardAsync(
        Guid userId)
    {
        return await _repository.GetDashboardAsync(userId);
    }

    public async Task<IEnumerable<UserBorrowedBookResponse>>
        GetBorrowedBooksAsync(Guid userId)
    {
        return await _repository.GetBorrowedBooksAsync(userId);
    }

    public async Task<IEnumerable<UserDueBookResponse>>
        GetDueBooksAsync(Guid userId)
    {
        return await _repository.GetDueBooksAsync(userId);
    }

    public async Task<IEnumerable<UserHistoryResponse>>
        GetHistoryAsync(Guid userId)
    {
        return await _repository.GetHistoryAsync(userId);
    }

    public async Task<UserProfileResponse?>
        GetProfileAsync(Guid userId)
    {
        return await _repository.GetProfileAsync(userId);
    }

    public async Task<bool> UpdateProfileNameAsync(
        Guid userId,
        string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        return await _repository.UpdateProfileNameAsync(
            userId,
            name.Trim()
        );
    }

    public async Task<bool> ReturnBookAsync(
        Guid userId,
        Guid borrowingId,
        string paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
        {
            return false;
        }

        return await _repository.ReturnBookAsync(
            userId,
            borrowingId,
            paymentMethod.Trim()
        );
    }

    public async Task<IEnumerable<UserUpcomingBookResponse>>
        GetUpcomingBooksAsync(Guid userId)
    {
        return await _repository.GetUpcomingBooksAsync(userId);
    }

    public async Task<Guid> BorrowBookAsync(
        Guid userId,
        Guid bookId)
    {
        return await _repository.BorrowBookAsync(
            userId,
            bookId
        );
    }

    public async Task<bool> CanBorrowBooksAsync(
        Guid userId)
    {
        return await _repository.CanBorrowBooksAsync(userId);
    }

    public async Task<IEnumerable<UserNotificationResponse>>
        GetNotificationsAsync(Guid userId)
    {
        return await _repository.GetNotificationsAsync(userId);
    }

    public async Task<bool> MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId)
    {
        return await _repository.MarkNotificationAsReadAsync(
            userId,
            notificationId
        );
    }

    public async Task<bool> MarkNotificationAsUnreadAsync(
        Guid userId,
        Guid notificationId)
    {
        return await _repository.MarkNotificationAsUnreadAsync(
            userId,
            notificationId
        );
    }

    public async Task<bool> MarkAllNotificationsAsReadAsync(
        Guid userId)
    {
        return await _repository.MarkAllNotificationsAsReadAsync(
            userId
        );
    }

    public async Task<bool> DeleteNotificationAsync(
        Guid userId,
        Guid notificationId)
    {
        return await _repository.DeleteNotificationAsync(
            userId,
            notificationId
        );
    }

    public async Task<int> GetUnreadNotificationCountAsync(
        Guid userId)
    {
        return await _repository.GetUnreadNotificationCountAsync(
            userId
        );
    }

    public async Task<bool> SubmitFeedbackAsync(
        Guid userId,
        string feedback)
    {
        if (string.IsNullOrWhiteSpace(feedback))
        {
            return false;
        }

        return await _repository.SubmitFeedbackAsync(
            userId,
            feedback.Trim()
        );
    }

    public async Task<bool> CreateBookReturnedNotificationAsync(
        Guid borrowingId)
    {
        return await _repository.CreateBookReturnedNotificationAsync(
            borrowingId
        );
    }

    public async Task<bool> CreateBookAvailabilityNotificationAsync(
        Guid userId,
        Guid bookId)
    {
        return await _repository
            .CreateBookAvailabilityNotificationAsync(
                userId,
                bookId
            );
    }
    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    public async Task<bool> UpdateProfileAsync(
    Guid userId,
    UpdateProfileRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
        {
            throw new InvalidOperationException(
                "Username is required."
            );
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new InvalidOperationException(
                "Email is required."
            );
        }

        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            throw new InvalidOperationException(
                "Current password is required."
            );
        }

        return await _repository.UpdateProfileAsync(
            userId,
            request
        );
    }


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    public async Task<bool> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.CurrentPassword))
        {
            throw new InvalidOperationException(
                "Current password is required."
            );
        }

        if (string.IsNullOrWhiteSpace(
                request.NewPassword))
        {
            throw new InvalidOperationException(
                "New password is required."
            );
        }

        if (request.NewPassword.Length > 18)
        {
            throw new InvalidOperationException(
                "Password must not exceed 18 characters."
            );
        }

        if (request.CurrentPassword ==
            request.NewPassword)
        {
            throw new InvalidOperationException(
                "New password must be different from the current password."
            );
        }

        return await _repository.ChangePasswordAsync(
            userId,
            request
        );
    }


    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    public async Task<bool> DeleteAccountAsync(
        Guid userId,
        DeleteAccountRequest request)
    {
        if (string.IsNullOrWhiteSpace(
                request.Password))
        {
            throw new InvalidOperationException(
                "Password is required."
            );
        }

        return await _repository.DeleteAccountAsync(
            userId,
            request
        );
    }

    public async Task<string> ChatbotAsync(
    Guid userId,
    string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return "Sure 😊 What would you like to know?";
        }

        return await _repository.ChatbotAsync(
            userId,
            message.Trim()
        );
    }
}
