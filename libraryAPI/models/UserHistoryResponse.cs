namespace LibraryAPI.Models;

public class UserHistoryResponse
{
    public Guid BorrowingId { get; set; }
    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;

    public string? CoverImage { get; set; }

    public DateTime BorrowedDate { get; set; }
    public DateTime ReturnedDate { get; set; }

    public decimal Fine { get; set; }

    public string Status { get; set; } = "Returned";
}