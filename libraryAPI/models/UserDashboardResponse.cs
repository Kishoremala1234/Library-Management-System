namespace LibraryAPI.Models;

public class UserDashboardResponse
{
    public string UserName { get; set; } = string.Empty;

    public int BorrowedCount { get; set; }

    public int DueSoonCount { get; set; }

    public int OverdueCount { get; set; }

    public decimal TotalFine { get; set; }

    public List<RecentBorrowedBook> RecentBooks { get; set; } = [];
}

public class RecentBorrowedBook
{
    public Guid BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime DueDate { get; set; }
    public string Status { get; set; } = string.Empty;
}