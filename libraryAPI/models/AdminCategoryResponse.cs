namespace LibraryAPI.Models;

public class AdminCategoryResponse
{
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}