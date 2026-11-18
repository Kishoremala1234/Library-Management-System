public class ReturnBorrowingRecord
{
    public Guid BorrowingId { get; set; }
    public Guid BookId { get; set; }
    public int NumberOfCopies { get; set; }
    public DateTime? ReturnDate { get; set; }
    public DateTime DueDate { get; set; }
    public string BookTitle { get; set; } = string.Empty;
}



