using LibraryAPI.Models;
using LibraryAPI.Repositories;

namespace LibraryAPI.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _repository;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(
        IAuthRepository repository,
        IJwtTokenService jwtTokenService)
    {
        _repository = repository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<(
        bool Success,
        string Message,
        Guid? UserId,
        string? Token,
        string? Username,
        string? Role
    )> SignupAsync(SignupRequest request)
    {
        if (await _repository.UsernameExistsAsync(request.Username))
        {
            return (
                false,
                "Username already exists.",
                null,
                null,
                null,
                null
            );
        }

        if (await _repository.EmailExistsAsync(request.Email))
        {
            return (
                false,
                "Email already exists.",
                null,
                null,
                null,
                null
            );
        }

        var userId =
            await _repository.SignupAsync(request);

        var role = "User";

        var token =
            _jwtTokenService.CreateToken(
                userId,
                request.Username,
                role
            );

        return (
            true,
            "Account created successfully.",
            userId,
            token,
            request.Username,
            role
        );
    }


    public async Task<bool> UsernameExistsAsync(
        string username)
    {
        return await _repository.UsernameExistsAsync(
            username
        );
    }


    public async Task<bool> EmailExistsAsync(
        string email)
    {
        return await _repository.EmailExistsAsync(
            email
        );
    }


    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request)
    {
        return await _repository.LoginAsync(
            request
        );
    }


    public async Task<bool> RequestAdminAsync(
        string usernameOrEmail,
        string message)
    {
        return await _repository.RequestAdminAsync(
            usernameOrEmail,
            message
        );
    }


    // =========================
    // CHECK RECENT ADMIN REQUEST
    // =========================

    public async Task<bool> HasRecentAdminRequestAsync(
        string usernameOrEmail)
    {
        return await _repository.HasRecentAdminRequestAsync(
            usernameOrEmail
        );
    }

    // =========================
    // CHANGE PASSWORD
    // =========================

    public async Task<(bool Success, string Message)> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword)
    {
        return await _repository.ChangePasswordAsync(
            userId,
            currentPassword,
            newPassword
        );
    }
}
