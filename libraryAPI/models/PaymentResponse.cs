namespace LibraryAPI.Models;

public class PaymentResponse
{
    public Guid PaymentId { get; set; }

    public Guid BookId { get; set; }

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string? TransactionReference { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}