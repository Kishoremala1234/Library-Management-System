namespace LibraryAPI.Models;

public class AdminWalletResponse
{
    public Guid WalletId { get; set; }
    public Guid UserId { get; set; }
    public decimal Balance { get; set; }
}