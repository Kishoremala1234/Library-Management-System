using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public interface IAuthRepository
{
    Task<bool> UsernameExistsAsync(string username);

    Task<bool> EmailExistsAsync(string email);

    Task<Guid> SignupAsync(SignupRequest request);

    Task<AuthResponse?> LoginAsync(LoginRequest request);

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