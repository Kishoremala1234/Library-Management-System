namespace LibraryAPI.Models;

public class AdminBorrowingResponse
{
    public Guid BorrowingId { get; set; }

    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public DateTime BorrowedDate { get; set; }

    public DateTime DueDate { get; set; }

    public DateTime? ReturnedDate { get; set; }

    public decimal Fine { get; set; }

    public string Status { get; set; } = string.Empty;
}