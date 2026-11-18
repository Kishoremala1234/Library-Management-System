namespace LibraryAPI.Models;

public class WalletTransactionResponse
{
    public Guid TransactionId { get; set; }

    public string TransactionType { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string? Description { get; set; }

    public Guid? ReferenceId { get; set; }

    public DateTime CreatedAt { get; set; }
}