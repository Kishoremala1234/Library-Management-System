namespace LibraryAPI.Models;

public class BookAvailability
{
    public Guid BookId { get; set; }

    public int TotalCopies { get; set; }

    public int AvailableCopies { get; set; }
}