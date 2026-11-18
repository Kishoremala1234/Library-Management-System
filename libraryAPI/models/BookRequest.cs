namespace LibraryAPI.Models;

public class BookRequest
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;

    public string Isbn { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? CoverImage { get; set; }
    public string? Publisher { get; set; }

    public int? PublishedYear { get; set; }

    public Guid CategoryId { get; set; }

    public int TotalCopies { get; set; }
    public int AvailableCopies { get; set; }

    public int Amount { get; set; }
}