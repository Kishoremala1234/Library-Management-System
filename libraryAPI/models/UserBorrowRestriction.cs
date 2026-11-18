namespace LibraryAPI.Models;

public class UserBorrowRestriction
{
    public int OverdueCount { get; set; }

    public decimal TotalFine { get; set; }
}
