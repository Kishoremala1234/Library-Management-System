using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public interface IUserRepository
{
    // =============================================================
    // USER DASHBOARD
    // =============================================================

    Task<UserDashboardResponse?> GetDashboardAsync(
        Guid userId);

    // =============================================================
    // BORROWED BOOKS
    // =============================================================

    Task<IEnumerable<UserBorrowedBookResponse>> GetBorrowedBooksAsync(
        Guid userId);

    // =============================================================
    // DUE BOOKS
    // =============================================================

    Task<IEnumerable<UserDueBookResponse>> GetDueBooksAsync(
        Guid userId);

    // =============================================================
    // HISTORY
    // =============================================================

    Task<IEnumerable<UserHistoryResponse>> GetHistoryAsync(
        Guid userId);

    // =============================================================
    // PROFILE
    // =============================================================

    Task<UserProfileResponse?> GetProfileAsync(
        Guid userId);

    Task<bool> UpdateProfileNameAsync(
        Guid userId,
        string name);

    // =============================================================
    // RETURN BOOK
    // =============================================================

    Task<bool> ReturnBookAsync(
        Guid userId,
        Guid borrowingId,
        string paymentMethod);

    // =============================================================
    // UPCOMING BOOKS
    // =============================================================

    Task<IEnumerable<UserUpcomingBookResponse>> GetUpcomingBooksAsync(
        Guid userId);

    // =============================================================
    // BORROW BOOK
    // =============================================================

    Task<Guid> BorrowBookAsync(
        Guid userId,
        Guid bookId);

    // =============================================================
    // CAN BORROW
    // =============================================================

    Task<bool> CanBorrowBooksAsync(
        Guid userId);

    // =============================================================
    // NOTIFICATIONS
    // =============================================================

    Task<IEnumerable<UserNotificationResponse>>
        GetNotificationsAsync(
            Guid userId);

    Task<bool> MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId);

    Task<bool> MarkAllNotificationsAsReadAsync(
        Guid userId);

    Task<bool> MarkNotificationAsUnreadAsync(
        Guid userId,
        Guid notificationId);

    Task<bool> DeleteNotificationAsync(
        Guid userId,
        Guid notificationId);

    Task<int> GetUnreadNotificationCountAsync(
        Guid userId);

    Task<bool> CreateBookReturnedNotificationAsync(
        Guid borrowingId);

    Task<bool> CreateBookAvailabilityNotificationAsync(
        Guid userId,
        Guid bookId);

    // =============================================================
    // FEEDBACK
    // =============================================================

    Task<bool> SubmitFeedbackAsync(
        Guid userId,
        string feedback);

    Task<bool> UpdateProfileAsync(
    Guid userId,
    UpdateProfileRequest request);

    Task<bool> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request);

    Task<bool> DeleteAccountAsync(
        Guid userId,
        DeleteAccountRequest request);

    Task<string> ChatbotAsync(Guid userId, string message);
}