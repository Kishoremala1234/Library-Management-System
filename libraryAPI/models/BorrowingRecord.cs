namespace LibraryAPI.Models;

public class BorrowingRecord
{
    public Guid BorrowingId { get; set; }

    public Guid BookId { get; set; }

    public DateTime? ReturnDate { get; set; }
}