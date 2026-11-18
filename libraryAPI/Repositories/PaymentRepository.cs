using Dapper;
using LibraryAPI.Context;
using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly DapperContext _context;

    public PaymentRepository(DapperContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET USER WALLET
    // =========================================================

    public async Task<WalletResponse?> GetWalletAsync(
        Guid userId)
    {
        using var connection =
            _context.CreateConnection();

        const string sql = """
            SELECT
                wallet_id AS WalletId,
                user_id AS UserId,
                COALESCE(balance, 0) AS Balance

            FROM wallets

            WHERE user_id = @UserId;
            """;

        return await connection
            .QuerySingleOrDefaultAsync<WalletResponse>(
                sql,
                new
                {
                    UserId = userId
                });
    }

    // =========================================================
    // ADD MONEY
    // =========================================================

    public async Task<bool> AddMoneyAsync(
        Guid userId,
        decimal amount,
        string paymentMethod)
    {
        using var connection =
            _context.CreateConnection();

        connection.Open();

        using var transaction =
            connection.BeginTransaction();

        try
        {
            // -------------------------------------------------
            // GET USER WALLET
            // -------------------------------------------------

            const string walletSql = """
                SELECT
                    wallet_id

                FROM wallets

                WHERE user_id = @UserId

                FOR UPDATE;
                """;

            var walletId =
                await connection.ExecuteScalarAsync<Guid?>(
                    walletSql,
                    new
                    {
                        UserId = userId
                    },
                    transaction);

            if (!walletId.HasValue)
            {
                transaction.Rollback();
                return false;
            }

            // -------------------------------------------------
            // UPDATE WALLET
            // -------------------------------------------------

            const string updateWalletSql = """
                UPDATE wallets

                SET
                    balance = COALESCE(balance, 0) + @Amount,
                    updated_at = CURRENT_TIMESTAMP

                WHERE wallet_id = @WalletId;
                """;

            var updated =
                await connection.ExecuteAsync(
                    updateWalletSql,
                    new
                    {
                        WalletId = walletId.Value,
                        Amount = amount
                    },
                    transaction);

            if (updated == 0)
            {
                transaction.Rollback();
                return false;
            }

            // -------------------------------------------------
            // WALLET TRANSACTION
            // -------------------------------------------------

            const string transactionSql = """
                INSERT INTO wallet_transactions
                (
                    wallet_id,
                    transaction_type,
                    amount,
                    description,
                    reference_id
                )
                VALUES
                (
                    @WalletId,
                    'Credit',
                    @Amount,
                    @Description,
                    NULL
                );
                """;

            await connection.ExecuteAsync(
                transactionSql,
                new
                {
                    WalletId = walletId.Value,
                    Amount = amount,
                    Description =
                        $"Wallet top-up using {paymentMethod}"
                },
                transaction);

            transaction.Commit();

            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    // =========================================================
    // WALLET TRANSACTIONS
    // =========================================================

    public async Task<IEnumerable<WalletTransactionResponse>>
        GetWalletTransactionsAsync(Guid userId)
    {
        using var connection =
            _context.CreateConnection();

        const string sql = """
            SELECT
                wt.transaction_id AS TransactionId,

                wt.transaction_type AS TransactionType,

                wt.amount AS Amount,

                wt.description AS Description,

                wt.reference_id AS ReferenceId,

                wt.created_at AS CreatedAt

            FROM wallet_transactions wt

            INNER JOIN wallets w
                ON wt.wallet_id = w.wallet_id

            WHERE w.user_id = @UserId

            ORDER BY wt.created_at DESC;
            """;

        return await connection.QueryAsync<WalletTransactionResponse>(
            sql,
            new
            {
                UserId = userId
            });
    }

    // =========================================================
    // BUY BOOK
    // =========================================================

    public async Task<BookPurchaseResponse> BuyBookAsync(
        Guid userId,
        Guid bookId,
        string paymentMethod)
    {
        using var connection =
            _context.CreateConnection();

        connection.Open();

        using var transaction =
            connection.BeginTransaction();

        try
        {
            // -------------------------------------------------
            // GET BOOK
            // -------------------------------------------------

            const string bookSql = """
                SELECT
                    book_id AS BookId,

                    title AS BookTitle,

                    COALESCE(NULLIF(price, 0), amount, 0) AS Price,

                    COALESCE(available_copies, 0)
                        AS AvailableCopies

                FROM books

                WHERE book_id = @BookId
                  AND is_deleted = FALSE

                FOR UPDATE;
                """;

            var book =
                await connection
                    .QuerySingleOrDefaultAsync<BookPurchaseRecord>(
                        bookSql,
                        new
                        {
                            BookId = bookId
                        },
                        transaction);

            if (book == null)
            {
                throw new InvalidOperationException(
                    "Book not found.");
            }

            if (book.AvailableCopies <= 0)
            {
                throw new InvalidOperationException(
                    "This book is currently unavailable.");
            }

            decimal price = book.Price;

            // -------------------------------------------------
            // CHECK PRICE
            // -------------------------------------------------

            if (price <= 0)
            {
                throw new InvalidOperationException(
                    "This book does not have a valid price.");
            }

            // -------------------------------------------------
            // CHECK ALREADY PURCHASED
            // -------------------------------------------------

            const string existingPurchaseSql = """
                SELECT COUNT(*)

                FROM book_purchases

                WHERE user_id = @UserId
                  AND book_id = @BookId;
                """;

            var alreadyPurchased =
                await connection.ExecuteScalarAsync<int>(
                    existingPurchaseSql,
                    new
                    {
                        UserId = userId,
                        BookId = bookId
                    },
                    transaction);

            if (alreadyPurchased > 0)
            {
                throw new InvalidOperationException(
                    "You have already purchased this book.");
            }

            // -------------------------------------------------
            // GET USER WALLET
            // -------------------------------------------------

            const string walletSql = """
                SELECT
                    wallet_id AS WalletId,

                    COALESCE(balance, 0)
                        AS Balance

                FROM wallets

                WHERE user_id = @UserId

                FOR UPDATE;
                """;

            var wallet =
                await connection
                    .QuerySingleOrDefaultAsync<UserWalletRecord>(
                        walletSql,
                        new
                        {
                            UserId = userId
                        },
                        transaction);

            if (wallet == null)
            {
                throw new InvalidOperationException(
                    "Wallet not found.");
            }

            // -------------------------------------------------
            // CHECK WALLET BALANCE
            // -------------------------------------------------

            if (wallet.Balance < price)
            {
                throw new InvalidOperationException(
                    $"Insufficient wallet balance.");
            }

            // -------------------------------------------------
            // FIND ADMIN
            // -------------------------------------------------

            const string adminSql = """
                SELECT
                    u.user_id

                FROM users u

                INNER JOIN roles r
                    ON u.role_id = r.role_id

                WHERE LOWER(r.role_name) = 'admin'
                  AND u.is_active = TRUE
                  AND u.is_deleted = FALSE

                LIMIT 1;
                """;

            var adminUserId =
                await connection.ExecuteScalarAsync<Guid?>(
                    adminSql,
                    transaction: transaction);

            if (!adminUserId.HasValue)
            {
                throw new InvalidOperationException(
                    "Admin account not found.");
            }

            // -------------------------------------------------
            // GET ADMIN WALLET
            // -------------------------------------------------

            const string adminWalletSql = """
                SELECT
                    wallet_id

                FROM wallets

                WHERE user_id = @AdminUserId

                FOR UPDATE;
                """;

            var adminWalletId =
                await connection.ExecuteScalarAsync<Guid?>(
                    adminWalletSql,
                    new
                    {
                        AdminUserId =
                            adminUserId.Value
                    },
                    transaction);

            if (!adminWalletId.HasValue)
            {
                throw new InvalidOperationException(
                    "Admin wallet not found.");
            }

            // -------------------------------------------------
            // CREATE PAYMENT
            // -------------------------------------------------

            const string paymentSql = """
                INSERT INTO payments
                (
                    user_id,
                    book_id,
                    amount,
                    payment_method,
                    payment_status,
                    transaction_reference,
                    created_at,
                    completed_at
                )
                VALUES
                (
                    @UserId,
                    @BookId,
                    @Amount,
                    @PaymentMethod,
                    'Success',
                    @TransactionReference,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP
                )
                RETURNING payment_id;
                """;

            var paymentId =
                await connection.ExecuteScalarAsync<Guid>(
                    paymentSql,
                    new
                    {
                        UserId = userId,

                        BookId = bookId,

                        Amount = price,

                        PaymentMethod = paymentMethod,

                        TransactionReference =
                            $"PAY-{Guid.NewGuid():N}"
                    },
                    transaction);

            // -------------------------------------------------
            // DEBIT USER WALLET
            // -------------------------------------------------

            const string debitWalletSql = """
                UPDATE wallets

                SET
                    balance =
                        COALESCE(balance, 0) - @Amount,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE wallet_id = @WalletId
                  AND COALESCE(balance, 0) >= @Amount;
                """;

            var debitRows =
                await connection.ExecuteAsync(
                    debitWalletSql,
                    new
                    {
                        WalletId = wallet.WalletId,
                        Amount = price
                    },
                    transaction);

            if (debitRows == 0)
            {
                throw new InvalidOperationException(
                    "Unable to process wallet payment.");
            }

            // -------------------------------------------------
            // CREDIT ADMIN WALLET
            // -------------------------------------------------

            const string creditAdminSql = """
                UPDATE wallets

                SET
                    balance =
                        COALESCE(balance, 0) + @Amount,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE wallet_id = @WalletId;
                """;

            var adminCreditRows =
                await connection.ExecuteAsync(
                    creditAdminSql,
                    new
                    {
                        WalletId =
                            adminWalletId.Value,

                        Amount = price
                    },
                    transaction);

            if (adminCreditRows == 0)
            {
                throw new InvalidOperationException(
                    "Unable to credit admin wallet.");
            }

            // -------------------------------------------------
            // USER WALLET TRANSACTION
            // -------------------------------------------------

            const string userTransactionSql = """
                INSERT INTO wallet_transactions
                (
                    wallet_id,
                    transaction_type,
                    amount,
                    description,
                    reference_id
                )
                VALUES
                (
                    @WalletId,
                    'Debit',
                    @Amount,
                    @Description,
                    @ReferenceId
                );
                """;

            await connection.ExecuteAsync(
                userTransactionSql,
                new
                {
                    WalletId = wallet.WalletId,

                    Amount = price,

                    Description =
                        $"Purchased \"{book.BookTitle}\"",

                    ReferenceId = paymentId
                },
                transaction);

            // -------------------------------------------------
            // ADMIN WALLET TRANSACTION
            // -------------------------------------------------

            const string adminTransactionSql = """
                INSERT INTO wallet_transactions
                (
                    wallet_id,
                    transaction_type,
                    amount,
                    description,
                    reference_id
                )
                VALUES
                (
                    @WalletId,
                    'Credit',
                    @Amount,
                    @Description,
                    @ReferenceId
                );
                """;

            await connection.ExecuteAsync(
                adminTransactionSql,
                new
                {
                    WalletId =
                        adminWalletId.Value,

                    Amount = price,

                    Description =
                        $"Sale of \"{book.BookTitle}\"",

                    ReferenceId = paymentId
                },
                transaction);

            // -------------------------------------------------
            // CREATE PURCHASE
            // -------------------------------------------------

            const string purchaseSql = """
                INSERT INTO book_purchases
                (
                    user_id,
                    book_id,
                    payment_id,
                    purchase_price
                )
                VALUES
                (
                    @UserId,
                    @BookId,
                    @PaymentId,
                    @PurchasePrice
                )
                RETURNING purchase_id;
                """;

            var purchaseId =
                await connection.ExecuteScalarAsync<Guid>(
                    purchaseSql,
                    new
                    {
                        UserId = userId,

                        BookId = bookId,

                        PaymentId = paymentId,

                        PurchasePrice = price
                    },
                    transaction);

            // -------------------------------------------------
            // REDUCE AVAILABLE COPIES
            // -------------------------------------------------

            const string updateCopiesSql = """
                UPDATE books

                SET
                    available_copies =
                        available_copies - 1,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE book_id = @BookId
                  AND available_copies > 0;
                """;

            var updatedCopies =
                await connection.ExecuteAsync(
                    updateCopiesSql,
                    new
                    {
                        BookId = bookId
                    },
                    transaction);

            if (updatedCopies == 0)
            {
                throw new InvalidOperationException(
                    "Book is no longer available.");
            }

            // -------------------------------------------------
            // COMMIT
            // -------------------------------------------------

            transaction.Commit();

            return new BookPurchaseResponse
            {
                PurchaseId = purchaseId,

                BookId = bookId,

                BookTitle = book.BookTitle,

                PurchasePrice = price,

                PurchaseDate = DateTime.UtcNow,

                PaymentStatus = "Success"
            };
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    // =========================================================
    // PURCHASED BOOKS
    // =========================================================

    public async Task<IEnumerable<BookPurchaseResponse>>
        GetPurchasedBooksAsync(Guid userId)
    {
        using var connection =
            _context.CreateConnection();

        const string sql = """
            SELECT
                bp.purchase_id AS PurchaseId,

                bp.book_id AS BookId,

                b.title AS BookTitle,

                bp.purchase_price AS PurchasePrice,

                bp.purchase_date AS PurchaseDate,

                p.payment_status AS PaymentStatus

            FROM book_purchases bp

            INNER JOIN books b
                ON bp.book_id = b.book_id

            INNER JOIN payments p
                ON bp.payment_id = p.payment_id

            WHERE bp.user_id = @UserId

            ORDER BY bp.purchase_date DESC;
            """;

        return await connection.QueryAsync<BookPurchaseResponse>(
            sql,
            new
            {
                UserId = userId
            });
    }

    // =========================================================
    // ADMIN BALANCE
    // =========================================================

    public async Task<decimal> GetAdminBalanceAsync()
    {
        using var connection =
            _context.CreateConnection();

        const string sql = """
            SELECT
                COALESCE(
                    w.balance,
                    0
                )

            FROM wallets w

            INNER JOIN users u
                ON w.user_id = u.user_id

            INNER JOIN roles r
                ON u.role_id = r.role_id

            WHERE LOWER(r.role_name) = 'admin'
              AND u.is_active = TRUE
              AND u.is_deleted = FALSE

            LIMIT 1;
            """;

        return await connection.ExecuteScalarAsync<decimal>(
            sql);
    }
}

// =============================================================
// PAYMENT RECORDS
// =============================================================

public class BookPurchaseRecord
{
    public Guid BookId { get; set; }

    public string BookTitle { get; set; } =
        string.Empty;

    public decimal Price { get; set; }

    public int AvailableCopies { get; set; }
}

public class UserWalletRecord
{
    public Guid WalletId { get; set; }

    public decimal Balance { get; set; }
}