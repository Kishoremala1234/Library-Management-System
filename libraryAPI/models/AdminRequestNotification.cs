namespace LibraryAPI.Models;

public class AdminRequestNotification
{
    public string UsernameOrEmail { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}