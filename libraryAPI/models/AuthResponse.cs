namespace LibraryAPI.Models;

public class AuthResponse
{
    public Guid UserId { get; set; }

    public string Username { get; set; } =
        string.Empty;

    public string Name { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string Role { get; set; } =
        string.Empty;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public bool PasswordValid { get; set; }

    // =========================
    // ADMIN REQUEST STATUS
    // =========================

    public bool HasRecentAdminRequest { get; set; }
}