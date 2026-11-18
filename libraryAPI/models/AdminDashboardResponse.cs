namespace LibraryAPI.Models;

public class AdminDashboardResponse
{
    public int TotalBooks { get; set; }

    public int TotalUsers { get; set; }

    public int ActiveBorrowings { get; set; }

    public int OverdueBooks { get; set; }

    public int TotalCategories { get; set; }
}