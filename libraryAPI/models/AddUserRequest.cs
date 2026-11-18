namespace LibraryAPI.Models;

public class AddUserRequest
{
    public string Username { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "User";
}