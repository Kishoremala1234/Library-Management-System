namespace LibraryAPI.Models;

public class BookResponse
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public int TotalBorrowings { get; set; }
    public string? Isbn { get; set; }
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public string? Publisher { get; set; }
    public int? PublishedYear { get; set; }

    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;

    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }

    public decimal Price { get; set; }
    public int Amount { get; set; }
}