namespace LibraryAPI.Models;

public class UserNotificationResponse
{
    public Guid NotificationId { get; set; }

    public Guid BorrowingId { get; set; }

    public string BookTitle { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class NotifyBookAvailabilityRequest
{
    public Guid BookId { get; set; }
}