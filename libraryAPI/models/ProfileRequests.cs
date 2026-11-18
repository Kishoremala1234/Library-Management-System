namespace LibraryAPI.Models;

public class UpdateProfileRequest
{

    public string Username { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string CurrentPassword { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;

    public string NewPassword { get; set; } = string.Empty;
}

public class DeleteAccountRequest
{
    public string Password { get; set; } = string.Empty;
}