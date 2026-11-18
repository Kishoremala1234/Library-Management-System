namespace LibraryAPI.Models;

public class BuyBookRequest
{
    public Guid BookId { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;
}