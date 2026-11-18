namespace LibraryAPI.Models;

public class AddMoneyRequest
{
    public decimal Amount { get; set; }

    public string PaymentMethod { get; set; } = string.Empty;
}