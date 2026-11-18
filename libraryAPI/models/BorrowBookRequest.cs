namespace LibraryAPI.Models;

public class BorrowBookRequest
{
    public Guid UserId { get; set; }

    public Guid BookId { get; set; }

    public DateTime DueDate { get; set; }
}