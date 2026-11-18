using LibraryAPI.Models;

namespace LibraryAPI.Services;

public interface IUserService
{
    Task<UserDashboardResponse?> GetDashboardAsync(
        Guid userId);

    Task<IEnumerable<UserBorrowedBookResponse>> GetBorrowedBooksAsync(
        Guid userId);

    Task<IEnumerable<UserDueBookResponse>> GetDueBooksAsync(
        Guid userId);

    Task<IEnumerable<UserHistoryResponse>> GetHistoryAsync(
        Guid userId);

    Task<UserProfileResponse?> GetProfileAsync(
        Guid userId);

    Task<bool> UpdateProfileNameAsync(
        Guid userId,
        string name);

    Task<bool> ReturnBookAsync(
        Guid userId,
        Guid borrowingId,
        string paymentMethod);

    Task<IEnumerable<UserUpcomingBookResponse>> GetUpcomingBooksAsync(
        Guid userId);

    Task<Guid> BorrowBookAsync(
        Guid userId,
        Guid bookId);

    Task<IEnumerable<UserNotificationResponse>>
        GetNotificationsAsync(Guid userId);

    Task<bool> MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId);

    Task<bool> MarkNotificationAsUnreadAsync(
        Guid userId,
        Guid notificationId);

    Task<bool> MarkAllNotificationsAsReadAsync(
        Guid userId);

    Task<bool> DeleteNotificationAsync(
        Guid userId,
        Guid notificationId);

    Task<int> GetUnreadNotificationCountAsync(
        Guid userId);

    Task<bool> CanBorrowBooksAsync(
        Guid userId);

    Task<bool> SubmitFeedbackAsync(
        Guid userId,
        string feedback);

    Task<bool> CreateBookReturnedNotificationAsync(
        Guid borrowingId);

    Task<bool> CreateBookAvailabilityNotificationAsync(
        Guid userId,
        Guid bookId);

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
