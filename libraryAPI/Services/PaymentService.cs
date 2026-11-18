using LibraryAPI.Models;
using LibraryAPI.Repositories;

namespace LibraryAPI.Services;

public class PaymentService : IPaymentService
{
    private readonly IPaymentRepository _repository;

    public PaymentService(
        IPaymentRepository repository)
    {
        _repository = repository;
    }

    public async Task<WalletResponse?> GetWalletAsync(
        Guid userId)
    {
        return await _repository.GetWalletAsync(
            userId);
    }

    public async Task<bool> AddMoneyAsync(
        Guid userId,
        decimal amount,
        string paymentMethod)
    {
        if (amount <= 0)
        {
            return false;
        }

        if (string.IsNullOrWhiteSpace(paymentMethod))
        {
            return false;
        }

        return await _repository.AddMoneyAsync(
            userId,
            amount,
            paymentMethod);
    }

    public async Task<IEnumerable<WalletTransactionResponse>>
        GetWalletTransactionsAsync(
            Guid userId)
    {
        return await _repository
            .GetWalletTransactionsAsync(userId);
    }

    public async Task<BookPurchaseResponse> BuyBookAsync(
        Guid userId,
        Guid bookId,
        string paymentMethod)
    {
        if (bookId == Guid.Empty)
        {
            throw new InvalidOperationException(
                "Book ID is required.");
        }

        if (string.IsNullOrWhiteSpace(paymentMethod))
        {
            throw new InvalidOperationException(
                "Payment method is required.");
        }

        return await _repository.BuyBookAsync(
            userId,
            bookId,
            paymentMethod);
    }

    public async Task<IEnumerable<BookPurchaseResponse>>
        GetPurchasedBooksAsync(
            Guid userId)
    {
        return await _repository
            .GetPurchasedBooksAsync(userId);
    }

    public async Task<decimal> GetAdminBalanceAsync()
    {
        return await _repository
            .GetAdminBalanceAsync();
    }
}