namespace LibraryAPI.Models;

public class PaymentDto
{
    public Guid PaymentId { get; set; }

    public Guid UserId { get; set; }

    public Guid BookId { get; set; }

    public string UserName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string BookTitle { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;

    public string PaymentStatus { get; set; } = string.Empty;

    public string? TransactionReference { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? PaymentPurpose { get; set; }
}