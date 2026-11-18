namespace LibraryAPI.Models;

public class BookPurchaseResponse
{
    public Guid PurchaseId { get; set; }

    public Guid BookId { get; set; }

    public string BookTitle { get; set; } = string.Empty;

    public decimal PurchasePrice { get; set; }

    public DateTime PurchaseDate { get; set; }

    public string PaymentStatus { get; set; } = string.Empty;
}