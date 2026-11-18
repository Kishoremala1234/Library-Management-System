using LibraryAPI.Models;
using LibraryAPI.Repositories;

namespace LibraryAPI.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _repository;

    public AdminService(IAdminRepository repository)
    {
        _repository = repository;
    }

    // =========================================================
    // DASHBOARD
    // =========================================================

    public async Task<AdminDashboardResponse> GetDashboardAsync()
    {
        return await _repository.GetDashboardAsync();
    }

    // =========================================================
    // BOOKS
    // =========================================================

    public async Task<IEnumerable<AdminBookResponse>> GetBooksAsync()
    {
        return await _repository.GetBooksAsync();
    }

    public async Task<Guid> AddBookAsync(
        BookRequest request)
    {
        return await _repository.AddBookAsync(request);
    }

    public async Task<bool> UpdateBookAsync(
        Guid bookId,
        BookRequest request)
    {
        return await _repository.UpdateBookAsync(
            bookId,
            request
        );
    }

    public async Task<bool> DeleteBookAsync(
        Guid bookId)
    {
        return await _repository.DeleteBookAsync(
            bookId
        );
    }

    // =========================================================
    // CATEGORIES
    // =========================================================

    public async Task<IEnumerable<AdminCategoryResponse>> GetCategoriesAsync()
    {
        return await _repository.GetCategoriesAsync();
    }

    public async Task<Guid> AddCategoryAsync(
        CategoryRequest request)
    {
        return await _repository.AddCategoryAsync(
            request
        );
    }

    public async Task<bool> UpdateCategoryAsync(
        Guid categoryId,
        CategoryRequest request)
    {
        return await _repository.UpdateCategoryAsync(
            categoryId,
            request
        );
    }

    public async Task<bool> DeleteCategoryAsync(
        Guid categoryId)
    {
        return await _repository.DeleteCategoryAsync(
            categoryId
        );
    }

    // =========================================================
    // USERS
    // =========================================================

    public async Task<IEnumerable<AdminUserResponse>> GetUsersAsync()
    {
        return await _repository.GetUsersAsync();
    }

    public async Task<bool> UpdateUserStatusAsync(
        Guid userId,
        bool isActive)
    {
        return await _repository.UpdateUserStatusAsync(
            userId,
            isActive
        );
    }

    public async Task<Guid> AddUserAsync(
        AddUserRequest request)
    {
        return await _repository.AddUserAsync(
            request
        );
    }

    public async Task<bool> DeleteUserAsync(
        Guid userId)
    {
        return await _repository.DeleteUserAsync(
            userId
        );
    }

    // =========================================================
    // BORROWINGS
    // =========================================================

    public async Task<IEnumerable<AdminBorrowingResponse>> GetBorrowingsAsync()
    {
        return await _repository.GetBorrowingsAsync();
    }

    public async Task<Guid> BorrowBookAsync(
        BorrowBookRequest request)
    {
        return await _repository.BorrowBookAsync(
            request
        );
    }

    public async Task<bool> ReturnBookAsync(
        Guid borrowingId)
    {
        return await _repository.ReturnBookAsync(
            borrowingId
        );
    }

   
    // =========================================================
    // NOTIFICATIONS
    // =========================================================

    public async Task<IEnumerable<AdminNotificationResponse>> GetNotificationsAsync()
    {
        return await _repository.GetNotificationsAsync();
    }

    public async Task<bool> MarkNotificationAsReadAsync(
    Guid notificationId)
    {
        return await _repository
            .MarkNotificationAsReadAsync(
                notificationId
            );
    }

    public async Task<bool> MarkNotificationAsUnreadAsync(
        Guid notificationId)
    {
        return await _repository
            .MarkNotificationAsUnreadAsync(
                notificationId
            );
    }

    public async Task<bool> DeleteNotificationAsync(
        Guid notificationId)
    {
        return await _repository
            .DeleteNotificationAsync(
                notificationId
            );
    }

    public async Task<bool> CreateReturnNotificationAsync(
        Guid borrowingId)
    {
        return await _repository
            .CreateReturnNotificationAsync(
                borrowingId
            );
    }

    public async Task<IEnumerable<PaymentDto>> GetAdminPaymentsAsync()
    {
        return await _repository.GetAdminPaymentsAsync();
    }
    public async Task<AdminWalletResponse?> GetAdminWalletAsync()
    {
        return await _repository.GetAdminWalletAsync();
    }

    public async Task<bool> SendUserNotificationAsync(
     Guid userId,
     string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        return await _repository.SendUserNotificationAsync(
            userId,
            message.Trim()
        );
    }
}