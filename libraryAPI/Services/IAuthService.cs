using LibraryAPI.Models;

namespace LibraryAPI.Services;

public interface IAuthService
{
    Task<(
        bool Success,
        string Message,
        Guid? UserId,
        string? Token,
        string? Username,
        string? Role
    )> SignupAsync(SignupRequest request);

    Task<AuthResponse?> LoginAsync(
        LoginRequest request
    );

    Task<bool> UsernameExistsAsync(
        string username
    );

    Task<bool> EmailExistsAsync(
        string email
    );

    Task<bool> RequestAdminAsync(
        string usernameOrEmail,
        string message
    );

    Task<bool> HasRecentAdminRequestAsync(
        string usernameOrEmail
    );
    Task<(bool Success, string Message)> ChangePasswordAsync(
    Guid userId,
    string currentPassword,
    string newPassword
);
}
