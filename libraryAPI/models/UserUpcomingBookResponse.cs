namespace LibraryAPI.Models;

public class UserUpcomingBookResponse
{
    public Guid BorrowingId { get; set; }
    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;

    public string? CoverImage { get; set; }

    public DateTime DueDate { get; set; }

    public decimal Fine { get; set; }

    public string Status { get; set; } = "Upcoming";
}