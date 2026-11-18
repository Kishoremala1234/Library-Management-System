namespace LibraryAPI.Models;

public class HomeBookSearchResponse
{
    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string? CoverImage { get; set; }

    public string CategoryName { get; set; } = string.Empty;

    public int AvailableCopies { get; set; }

    public string AvailabilityStatus { get; set; } = string.Empty;
}