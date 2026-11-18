using LibraryAPI.Models;

namespace LibraryAPI.Services;

public interface IPaymentService
{
    Task<WalletResponse?> GetWalletAsync(
        Guid userId);

    Task<bool> AddMoneyAsync(
        Guid userId,
        decimal amount,
        string paymentMethod);

    Task<IEnumerable<WalletTransactionResponse>>
        GetWalletTransactionsAsync(
            Guid userId);

    Task<BookPurchaseResponse> BuyBookAsync(
        Guid userId,
        Guid bookId,
        string paymentMethod);

    Task<IEnumerable<BookPurchaseResponse>>
        GetPurchasedBooksAsync(
            Guid userId);

    Task<decimal> GetAdminBalanceAsync();
}