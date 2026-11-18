namespace LibraryAPI.Models;

public class AdminNotificationResponse
{
    public Guid NotificationId { get; set; }

    public Guid BorrowingId { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string NotificationType { get; set; } = string.Empty;
    
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }
}