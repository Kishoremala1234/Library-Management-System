using LibraryAPI.Models;

namespace LibraryAPI.Services;

public interface IAdminService
{
    Task<AdminDashboardResponse> GetDashboardAsync();

    Task<IEnumerable<AdminBookResponse>> GetBooksAsync();

    Task<Guid> AddBookAsync(BookRequest request);

    Task<bool> UpdateBookAsync(
        Guid bookId,
        BookRequest request);

    Task<bool> DeleteBookAsync(Guid bookId);
    Task<IEnumerable<AdminCategoryResponse>> GetCategoriesAsync();

    Task<Guid> AddCategoryAsync(CategoryRequest request);

    Task<bool> UpdateCategoryAsync(
        Guid categoryId,
        CategoryRequest request);

    Task<bool> DeleteCategoryAsync(Guid categoryId);

    Task<IEnumerable<AdminUserResponse>> GetUsersAsync();

    Task<bool> UpdateUserStatusAsync(
        Guid userId,
        bool isActive);

    Task<IEnumerable<AdminBorrowingResponse>> GetBorrowingsAsync();

    Task<Guid> BorrowBookAsync(
        BorrowBookRequest request);

    Task<bool> ReturnBookAsync(
        Guid borrowingId);

    Task<Guid> AddUserAsync(AddUserRequest request);

    Task<IEnumerable<AdminNotificationResponse>> GetNotificationsAsync();

    Task<bool> MarkNotificationAsReadAsync(
        Guid notificationId);

    Task<bool> MarkNotificationAsUnreadAsync(
        Guid notificationId);

    Task<bool> DeleteNotificationAsync(
        Guid notificationId);

    Task<bool> CreateReturnNotificationAsync(
        Guid borrowingId);


    Task<bool> DeleteUserAsync(Guid userId);

    Task<IEnumerable<PaymentDto>> GetAdminPaymentsAsync();

    Task<AdminWalletResponse?> GetAdminWalletAsync();

    Task<bool> SendUserNotificationAsync(
    Guid userId,
    string message);

    
}
