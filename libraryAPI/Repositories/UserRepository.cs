using Dapper;
using LibraryAPI.Context;
using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public class UserRepository : IUserRepository
{
    private readonly DapperContext _context;

    // =========================================================
    // FINE CONFIGURATION
    // =========================================================

    private const decimal FinePerDay = 20m;

    public UserRepository(DapperContext context)
    {
        _context = context;
    }

    // =========================================================
    // USER DASHBOARD
    // =========================================================

    public async Task<UserDashboardResponse?> GetDashboardAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string userSql = """
            SELECT name
            FROM users
            WHERE user_id = @UserId
              AND is_active = TRUE
              AND is_deleted = FALSE;
            """;

        var userName = await connection.QuerySingleOrDefaultAsync<string>(
            userSql,
            new
            {
                UserId = userId
            }
        );

        if (userName == null)
        {
            return null;
        }

        const string statsSql = """
            SELECT
                COUNT(*) FILTER (
                    WHERE return_date IS NULL
                )::int AS BorrowedCount,

                COUNT(*) FILTER (
                    WHERE return_date IS NULL
                      AND due_date >= CURRENT_TIMESTAMP
                      AND due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
                )::int AS DueSoonCount,

                COUNT(*) FILTER (
                    WHERE return_date IS NULL
                      AND due_date < CURRENT_TIMESTAMP
                )::int AS OverdueCount,

                COALESCE(
                    SUM(
                        CASE
                            WHEN return_date IS NULL
                                 AND due_date < CURRENT_TIMESTAMP
                            THEN
                                GREATEST(
                                    FLOOR(
                                        EXTRACT(
                                            EPOCH FROM
                                            (CURRENT_TIMESTAMP - due_date)
                                        ) / 86400
                                    ),
                                    0
                                ) * @FinePerDay
                            ELSE 0
                        END
                    ),
                    0
                ) AS TotalFine

            FROM borrowings

            WHERE user_id = @UserId;
            """;

        var stats = await connection.QuerySingleAsync<UserDashboardResponse>(
            statsSql,
            new
            {
                UserId = userId,
                FinePerDay
            }
        );

        const string booksSql = """
            SELECT
                b.book_id AS BookId,
                b.title AS Title,
                b.author AS Author,
                br.due_date AS DueDate,

                CASE
                    WHEN br.due_date < CURRENT_TIMESTAMP
                        THEN 'Overdue'

                    WHEN br.due_date <=
                         CURRENT_TIMESTAMP + INTERVAL '7 days'
                        THEN 'Due Soon'

                    ELSE 'Borrowed'
                END AS Status

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.user_id = @UserId
              AND br.return_date IS NULL
              AND b.is_deleted = FALSE

            ORDER BY br.start_date DESC

            LIMIT 5;
            """;

        var recentBooks =
            await connection.QueryAsync<RecentBorrowedBook>(
                booksSql,
                new
                {
                    UserId = userId
                }
            );

        stats.UserName = userName;
        stats.RecentBooks = recentBooks.ToList();

        return stats;
    }

    // =========================================================
    // BORROWED BOOKS
    // =========================================================

    public async Task<IEnumerable<UserBorrowedBookResponse>>
        GetBorrowedBooksAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                br.borrowing_id AS BorrowingId,
                b.book_id AS BookId,

                b.title AS Title,
                b.author AS Author,
                b.cover_image AS CoverImage,

                br.start_date AS BorrowedDate,
                br.due_date AS DueDate,

                CASE
                    WHEN br.return_date IS NOT NULL
                        THEN COALESCE(br.fine, 0)

                    WHEN br.due_date < CURRENT_TIMESTAMP
                        THEN
                            GREATEST(
                                FLOOR(
                                    EXTRACT(
                                        EPOCH FROM
                                        (CURRENT_TIMESTAMP - br.due_date)
                                    ) / 86400
                                ),
                                0
                            ) * @FinePerDay

                    ELSE 0
                END AS Fine,

                CASE
                    WHEN br.due_date < CURRENT_TIMESTAMP
                        THEN 'Overdue'
                    ELSE 'Borrowed'
                END AS Status

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.user_id = @UserId
              AND br.return_date IS NULL
              AND b.is_deleted = FALSE

            ORDER BY br.start_date DESC;
            """;

        return await connection.QueryAsync<UserBorrowedBookResponse>(
            sql,
            new
            {
                UserId = userId,
                FinePerDay
            }
        );
    }

    // =========================================================
    // DUE BOOKS
    // =========================================================

    public async Task<IEnumerable<UserDueBookResponse>>
        GetDueBooksAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                br.borrowing_id AS BorrowingId,
                b.book_id AS BookId,

                b.title AS Title,
                b.author AS Author,
                b.cover_image AS CoverImage,

                br.due_date AS DueDate,

                CASE
                    WHEN br.return_date IS NOT NULL
                        THEN COALESCE(br.fine, 0)

                    WHEN br.due_date < CURRENT_TIMESTAMP
                        THEN
                            GREATEST(
                                FLOOR(
                                    EXTRACT(
                                        EPOCH FROM
                                        (CURRENT_TIMESTAMP - br.due_date)
                                    ) / 86400
                                ),
                                0
                            ) * @FinePerDay

                    ELSE 0
                END AS Fine,

                CASE
                    WHEN br.due_date < CURRENT_TIMESTAMP
                        THEN 'Overdue'

                    WHEN br.due_date <=
                         CURRENT_TIMESTAMP + INTERVAL '7 days'
                        THEN 'Due Soon'

                    ELSE 'Upcoming'
                END AS Status

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.user_id = @UserId
              AND br.return_date IS NULL
              AND b.is_deleted = FALSE
              AND br.due_date <=
                  CURRENT_TIMESTAMP + INTERVAL '7 days'

            ORDER BY br.due_date ASC;
            """;

        return await connection.QueryAsync<UserDueBookResponse>(
            sql,
            new
            {
                UserId = userId,
                FinePerDay
            }
        );
    }

    // =========================================================
    // HISTORY
    // =========================================================

    public async Task<IEnumerable<UserHistoryResponse>>
        GetHistoryAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                br.borrowing_id AS BorrowingId,
                b.book_id AS BookId,

                b.title AS Title,
                b.author AS Author,
                b.cover_image AS CoverImage,

                br.start_date AS BorrowedDate,
                br.return_date AS ReturnedDate,

                COALESCE(br.fine, 0) AS Fine,

                'Returned' AS Status

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.user_id = @UserId
              AND br.return_date IS NOT NULL
              AND b.is_deleted = FALSE

            ORDER BY br.return_date DESC;
            """;

        return await connection.QueryAsync<UserHistoryResponse>(
            sql,
            new
            {
                UserId = userId
            }
        );
    }

    // =========================================================
    // PROFILE
    // =========================================================

    public async Task<UserProfileResponse?>
        GetProfileAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                u.user_id AS UserId,
                u.username AS Username,
                u.name AS Name,
                u.email AS Email,
                u.phone AS Phone,
                r.role_name AS Role

            FROM users u

            INNER JOIN roles r
                ON u.role_id = r.role_id

            WHERE u.user_id = @UserId
              AND u.is_active = TRUE
              AND u.is_deleted = FALSE;
            """;

        return await connection.QuerySingleOrDefaultAsync<UserProfileResponse>(
            sql,
            new
            {
                UserId = userId
            }
        );
    }

    // =========================================================
    // UPDATE PROFILE NAME
    // =========================================================

    public async Task<bool> UpdateProfileNameAsync(
        Guid userId,
        string name)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE users
            SET
                name = @Name,
                updated_at = CURRENT_TIMESTAMP

            WHERE user_id = @UserId
              AND is_active = TRUE
              AND is_deleted = FALSE;
            """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                UserId = userId,
                Name = name.Trim()
            }
        );

        return rows > 0;
    }

    // =========================================================
    // RETURN BOOK
    // =========================================================

    public async Task<bool> ReturnBookAsync(
        Guid userId,
        Guid borrowingId,
        string paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
        {
            throw new InvalidOperationException(
                "Payment method is required."
            );
        }

        return await ReturnBookInternalAsync(
            userId,
            borrowingId,
            paymentMethod.Trim()
        );
    }

    // =========================================================
    // RETURN BOOK WITH PAYMENT
    // =========================================================

    public async Task<bool> ReturnBookWithPaymentAsync(
        Guid userId,
        Guid borrowingId,
        string paymentMethod)
    {
        if (string.IsNullOrWhiteSpace(paymentMethod))
        {
            throw new InvalidOperationException(
                "Payment method is required."
            );
        }

        paymentMethod = paymentMethod.Trim();

        return await ReturnBookInternalAsync(
            userId,
            borrowingId,
            paymentMethod
        );
    }

    // =========================================================
    // RETURN BOOK INTERNAL
    // =========================================================

    private async Task<bool> ReturnBookInternalAsync(
        Guid userId,
        Guid borrowingId,
        string? paymentMethod)
    {
        using var connection = _context.CreateConnection();

        connection.Open();

        using var transaction = connection.BeginTransaction();

        try
        {
            const string borrowingSql = """
                SELECT
                    br.borrowing_id AS BorrowingId,
                    br.book_id AS BookId,
                    br.number_of_copies AS NumberOfCopies,
                    br.return_date AS ReturnDate,
                    br.due_date AS DueDate,

                    b.title AS BookTitle

                FROM borrowings br

                INNER JOIN books b
                    ON br.book_id = b.book_id

                WHERE br.borrowing_id = @BorrowingId
                  AND br.user_id = @UserId

                FOR UPDATE;
                """;

            var borrowing =
                await connection.QuerySingleOrDefaultAsync<ReturnBorrowingRecord>(
                    borrowingSql,
                    new
                    {
                        BorrowingId = borrowingId,
                        UserId = userId
                    },
                    transaction
                );

            if (borrowing == null)
            {
                return false;
            }

            if (borrowing.ReturnDate != null)
            {
                return false;
            }

            var numberOfCopies =
                borrowing.NumberOfCopies > 0
                    ? borrowing.NumberOfCopies
                    : 1;

            const string fineSql = """
                SELECT
                    CASE
                        WHEN due_date < CURRENT_TIMESTAMP
                            THEN
                                GREATEST(
                                    FLOOR(
                                        EXTRACT(
                                            EPOCH FROM
                                            (
                                                CURRENT_TIMESTAMP
                                                - due_date
                                            )
                                        ) / 86400
                                    ),
                                    0
                                ) * @FinePerDay

                        ELSE 0
                    END
                FROM borrowings

                WHERE borrowing_id = @BorrowingId
                  AND user_id = @UserId;
                """;

            var finalFine =
                await connection.ExecuteScalarAsync<decimal>(
                    fineSql,
                    new
                    {
                        BorrowingId = borrowingId,
                        UserId = userId,
                        FinePerDay
                    },
                    transaction
                );

            if (finalFine > 0 &&
                    string.IsNullOrWhiteSpace(paymentMethod))
            {
                throw new InvalidOperationException(
                    $"A fine of ₹{finalFine:0.00} must be paid before completing the return."
                );
            }

            if (finalFine > 0)
            {
                const string walletSql = """
                    SELECT
                        wallet_id,
                        balance
                    FROM wallets
                    WHERE user_id = @UserId
                    FOR UPDATE;
                    """;

                var wallet =
                    await connection.QuerySingleOrDefaultAsync<WalletRecord>(
                        walletSql,
                        new
                        {
                            UserId = userId
                        },
                        transaction
                    );

                if (wallet == null)
                {
                    throw new InvalidOperationException(
                        "User wallet was not found."
                    );
                }

                if (wallet.Balance < finalFine)
                {
                    throw new InvalidOperationException(
                        $"Insufficient wallet balance..."
                    );
                }

                const string updateUserWalletSql = """
                    UPDATE wallets
                    SET
                        balance = balance - @Amount,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE wallet_id = @WalletId
                      AND user_id = @UserId
                      AND balance >= @Amount;
                    """;

                var walletUpdated =
                    await connection.ExecuteAsync(
                        updateUserWalletSql,
                        new
                        {
                            WalletId = wallet.WalletId,
                            UserId = userId,
                            Amount = finalFine
                        },
                        transaction
                    );

                if (walletUpdated != 1)
                {

                    throw new InvalidOperationException(
                        "Unable to deduct the fine from the wallet."
                    );
                }

                const string userWalletTransactionSql = """
                    INSERT INTO wallet_transactions
                    (
                        wallet_id,
                        transaction_type,
                        amount,
                        description,
                        reference_id,
                        created_at
                    )
                    VALUES
                    (
                        @WalletId,
                        'Debit',
                        @Amount,
                        @Description,
                        @ReferenceId,
                        CURRENT_TIMESTAMP
                    );
                    """;

                await connection.ExecuteAsync(
                    userWalletTransactionSql,
                    new
                    {
                        WalletId = wallet.WalletId,
                        Amount = finalFine,
                        Description =
                            $"Fine payment for returning \"{borrowing.BookTitle}\".",
                        ReferenceId = borrowingId
                    },
                    transaction
                );
            }

            if (finalFine > 0)
            {
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
                        'PAY-' || gen_random_uuid()::text,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    );
                    """;

                await connection.ExecuteAsync(
                    paymentSql,
                    new
                    {
                        UserId = userId,
                        BookId = borrowing.BookId,
                        Amount = finalFine,
                        PaymentMethod = paymentMethod
                    },
                    transaction
                );
            }

            const string updateBorrowingSql = """
                UPDATE borrowings
                SET
                    return_date = CURRENT_TIMESTAMP,
                    fine = @Fine,
                    status = 'Returned',
                    updated_at = CURRENT_TIMESTAMP

                WHERE borrowing_id = @BorrowingId
                  AND user_id = @UserId
                  AND return_date IS NULL

                RETURNING borrowing_id;
                """;

            var returnedBorrowingId =
                await connection.ExecuteScalarAsync<Guid?>(
                    updateBorrowingSql,
                    new
                    {
                        BorrowingId = borrowingId,
                        UserId = userId,
                        Fine = finalFine
                    },
                    transaction
                );

            if (!returnedBorrowingId.HasValue)
            {
                return false;
            }

            const string updateBookSql = """
                UPDATE books
                SET
                    available_copies =
                        LEAST(
                            available_copies + @NumberOfCopies,
                            total_copies
                        ),

                    updated_at = CURRENT_TIMESTAMP

                WHERE book_id = @BookId;
                """;

            await connection.ExecuteAsync(
                updateBookSql,
                new
                {
                    BookId = borrowing.BookId,
                    NumberOfCopies = numberOfCopies
                },
                transaction
            );

            const string adminSql = """
                SELECT u.user_id

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
                    transaction: transaction
                );

            if (finalFine > 0)
            {
                if (!adminUserId.HasValue)
                {
                    throw new InvalidOperationException(
                        "Admin user was not found. The fine cannot be transferred."
                    );
                }

                const string adminWalletSql = """
                    SELECT
                        wallet_id,
                        balance
                    FROM wallets
                    WHERE user_id = @AdminUserId
                    FOR UPDATE;
                    """;

                var adminWallet =
                    await connection.QuerySingleOrDefaultAsync<WalletRecord>(
                        adminWalletSql,
                        new
                        {
                            AdminUserId = adminUserId.Value
                        },
                        transaction
                    );

                if (adminWallet == null)
                {

                    throw new InvalidOperationException(
                        "Admin wallet was not found. The fine cannot be transferred."
                    );
                }

                const string updateAdminWalletSql = """
                    UPDATE wallets
                    SET
                        balance = balance + @Amount,
                        updated_at = CURRENT_TIMESTAMP

                    WHERE wallet_id = @WalletId
                      AND user_id = @AdminUserId;
                    """;

                var adminWalletUpdated =
                    await connection.ExecuteAsync(
                        updateAdminWalletSql,
                        new
                        {
                            WalletId = adminWallet.WalletId,
                            AdminUserId = adminUserId.Value,
                            Amount = finalFine
                        },
                        transaction
                    );

                if (adminWalletUpdated != 1)
                {

                    throw new InvalidOperationException(
                        "Unable to credit the fine to the admin wallet."
                    );
                }

                const string adminWalletTransactionSql = """
                    INSERT INTO wallet_transactions
                    (
                        wallet_id,
                        transaction_type,
                        amount,
                        description,
                        reference_id,
                        created_at
                    )
                    VALUES
                    (
                        @WalletId,
                        'Credit',
                        @Amount,
                        @Description,
                        @ReferenceId,
                        CURRENT_TIMESTAMP
                    );
                    """;

                await connection.ExecuteAsync(
                    adminWalletTransactionSql,
                    new
                    {
                        WalletId = adminWallet.WalletId,
                        Amount = finalFine,
                        Description =
                            $"Fine received for returning \"{borrowing.BookTitle}\".",
                        ReferenceId = borrowingId
                    },
                    transaction
                );
            }

            const string insertUserNotificationSql = """
                INSERT INTO notifications
                (
                    user_id,
                    recipient_user_id,
                    borrowing_id,
                    notification_type,
                    message,
                    is_read,
                    created_at
                )
                VALUES
                (
                    @UserId,
                    @RecipientUserId,
                    @BorrowingId,
                    'BookReturned',
                    @Message,
                    FALSE,
                    CURRENT_TIMESTAMP
                );
                """;

            await connection.ExecuteAsync(
                insertUserNotificationSql,
                new
                {
                    UserId = userId,
                    RecipientUserId = userId,
                    BorrowingId = borrowingId,

                    Message =
                        finalFine > 0
                            ? $"You returned \"{borrowing.BookTitle}\" successfully. Fine paid: ₹{finalFine:0.00}."
                            : $"You returned \"{borrowing.BookTitle}\" successfully. No fine."
                },
                transaction
            );

            if (adminUserId.HasValue)
            {
                const string insertAdminNotificationSql = """
                    INSERT INTO notifications
                    (
                        user_id,
                        recipient_user_id,
                        borrowing_id,
                        notification_type,
                        message,
                        is_read,
                        created_at
                    )
                    VALUES
                    (
                        @UserId,
                        @RecipientUserId,
                        @BorrowingId,
                        'BookReturned',
                        @Message,
                        FALSE,
                        CURRENT_TIMESTAMP
                    );
                    """;

                await connection.ExecuteAsync(
                    insertAdminNotificationSql,
                    new
                    {
                        UserId = userId,
                        RecipientUserId = adminUserId.Value,
                        BorrowingId = borrowingId,

                        Message =
                            finalFine > 0
                                ? $"User returned \"{borrowing.BookTitle}\" and paid a fine of ₹{finalFine:0.00}."
                                : $"User returned \"{borrowing.BookTitle}\" with no fine."
                    },
                    transaction
                );
            }

            transaction.Commit();

            return true;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public class WalletRecord
    {
        public Guid WalletId { get; set; }
        public decimal Balance { get; set; }
    }

    // =========================================================
    // UPCOMING BOOKS
    // =========================================================

    public async Task<IEnumerable<UserUpcomingBookResponse>>
        GetUpcomingBooksAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                br.borrowing_id AS BorrowingId,
                b.book_id AS BookId,

                b.title AS Title,
                b.author AS Author,
                b.cover_image AS CoverImage,

                br.due_date AS DueDate,

                0 AS Fine,

                'Upcoming' AS Status

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.user_id = @UserId
              AND br.return_date IS NULL
              AND br.due_date >
                  CURRENT_TIMESTAMP + INTERVAL '7 days'
              AND b.is_deleted = FALSE

            ORDER BY br.due_date ASC;
            """;

        return await connection.QueryAsync<UserUpcomingBookResponse>(
            sql,
            new
            {
                UserId = userId
            }
        );
    }

    // =========================================================
    // BORROW BOOK
    // =========================================================

    public async Task<Guid> BorrowBookAsync(
        Guid userId,
        Guid bookId)
    {
        using var connection = _context.CreateConnection();

        connection.Open();

        using var transaction = connection.BeginTransaction();

        try
        {
            const string userSql = """
                SELECT COUNT(*)

                FROM users

                WHERE user_id = @UserId
                  AND is_active = TRUE
                  AND is_deleted = FALSE;
                """;

            var userExists =
                await connection.ExecuteScalarAsync<int>(
                    userSql,
                    new
                    {
                        UserId = userId
                    },
                    transaction
                );

            if (userExists == 0)
            {
                throw new InvalidOperationException(
                    "User not found or inactive."
                );
            }

            const string restrictionSql = """
                SELECT
                    COUNT(*) FILTER (
                        WHERE return_date IS NULL
                          AND due_date < CURRENT_TIMESTAMP
                    ) AS OverdueCount,

                    COALESCE(
                        SUM(
                            CASE
                                WHEN return_date IS NULL
                                     AND due_date < CURRENT_TIMESTAMP
                                THEN
                                    GREATEST(
                                        FLOOR(
                                            EXTRACT(
                                                EPOCH FROM
                                                (
                                                    CURRENT_TIMESTAMP
                                                    - due_date
                                                )
                                            ) / 86400
                                        ),
                                        0
                                    ) * @FinePerDay
                                ELSE 0
                            END
                        ),
                        0
                    ) AS TotalFine

                FROM borrowings

                WHERE user_id = @UserId;
                """;

            var restriction =
                await connection.QuerySingleAsync<UserBorrowRestriction>(
                    restrictionSql,
                    new
                    {
                        UserId = userId,
                        FinePerDay
                    },
                    transaction
                );

            if (restriction.OverdueCount > 0)
            {
                throw new InvalidOperationException(
                    "You cannot borrow a new book because you have an overdue book. Please return the overdue book first."
                );
            }

            if (restriction.TotalFine > 0)
            {
                throw new InvalidOperationException(
                    $"You cannot borrow a new book because you have an outstanding fine of ₹{restriction.TotalFine:0.00}. Please clear the fine first."
                );
            }

            const string bookSql = """
                SELECT
                    book_id,
                    available_copies

                FROM books

                WHERE book_id = @BookId
                  AND is_deleted = FALSE

                FOR UPDATE;
                """;

            var book =
                await connection.QuerySingleOrDefaultAsync(
                    bookSql,
                    new
                    {
                        BookId = bookId
                    },
                    transaction
                );

            if (book == null)
            {
                throw new InvalidOperationException(
                    "Book not found."
                );
            }

            if (book.available_copies <= 0)
            {
                throw new InvalidOperationException(
                    "No copies available."
                );
            }

            const string existingBorrowSql = """
                SELECT COUNT(*)

                FROM borrowings

                WHERE user_id = @UserId
                  AND book_id = @BookId
                  AND return_date IS NULL;
                """;

            var alreadyBorrowed =
                await connection.ExecuteScalarAsync<int>(
                    existingBorrowSql,
                    new
                    {
                        UserId = userId,
                        BookId = bookId
                    },
                    transaction
                );

            if (alreadyBorrowed > 0)
            {
                throw new InvalidOperationException(
                    "You already have this book."
                );
            }

            const string insertSql = """
                INSERT INTO borrowings
                (
                    user_id,
                    book_id,
                    number_of_copies,
                    start_date,
                    due_date,
                    fine,
                    status
                )
                VALUES
                (
                    @UserId,
                    @BookId,
                    1,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP + INTERVAL '14 days',
                    0,
                    'Borrowed'
                )
                RETURNING borrowing_id;
                """;

            var borrowingId =
                await connection.ExecuteScalarAsync<Guid>(
                    insertSql,
                    new
                    {
                        UserId = userId,
                        BookId = bookId
                    },
                    transaction
                );

            const string updateBookSql = """
                UPDATE books
                SET
                    available_copies =
                        available_copies - 1,

                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE book_id = @BookId
                  AND available_copies > 0;
                """;

            var updatedRows =
                await connection.ExecuteAsync(
                    updateBookSql,
                    new
                    {
                        BookId = bookId
                    },
                    transaction
                );

            if (updatedRows == 0)
            {
                throw new InvalidOperationException(
                    "Book is no longer available."
                );
            }

            const string notificationDetailsSql = """
                SELECT
                    u.name AS UserName,
                    b.title AS BookTitle

                FROM users u

                INNER JOIN books b
                    ON b.book_id = @BookId

                WHERE u.user_id = @UserId;
                """;

            var notificationDetails =
                await connection.QuerySingleAsync<BookNotificationDetails>(
                    notificationDetailsSql,
                    new
                    {
                        UserId = userId,
                        BookId = bookId
                    },
                    transaction
                );

            const string adminSql = """
                SELECT u.user_id

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
                    transaction: transaction
                );

            if (adminUserId.HasValue)
            {
                const string notificationSql = """
                    INSERT INTO notifications
                    (
                        user_id,
                        recipient_user_id,
                        borrowing_id,
                        notification_type,
                        message,
                        is_read,
                        created_at
                    )
                    VALUES
                    (
                        @UserId,
                        @RecipientUserId,
                        @BorrowingId,
                        'BookBorrowed',
                        @Message,
                        FALSE,
                        CURRENT_TIMESTAMP
                    );
                    """;

                await connection.ExecuteAsync(
                    notificationSql,
                    new
                    {
                        UserId = userId,
                        RecipientUserId = adminUserId.Value,
                        BorrowingId = borrowingId,
                        Message =
                            $"{notificationDetails.UserName} borrowed \"{notificationDetails.BookTitle}\"."
                    },
                    transaction
                );
            }

            transaction.Commit();

            return borrowingId;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    // =========================================================
    // CAN BORROW
    // =========================================================

    public async Task<bool> CanBorrowBooksAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT EXISTS
            (
                SELECT 1

                FROM borrowings

                WHERE user_id = @UserId
                  AND return_date IS NULL

                  AND
                  (
                      due_date < CURRENT_TIMESTAMP

                      OR
                      (
                          due_date < CURRENT_TIMESTAMP
                          AND
                          GREATEST(
                              FLOOR(
                                  EXTRACT(
                                      EPOCH FROM
                                      (CURRENT_TIMESTAMP - due_date)
                                  ) / 86400
                              ),
                              0
                          ) * @FinePerDay > 0
                      )
                  )
            );
            """;

        var hasRestriction =
            await connection.ExecuteScalarAsync<bool>(
                sql,
                new
                {
                    UserId = userId,
                    FinePerDay
                }
            );

        return !hasRestriction;
    }

    // =========================================================
    // GET NOTIFICATIONS
    // =========================================================

    public async Task<IEnumerable<UserNotificationResponse>>
        GetNotificationsAsync(Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                n.notification_id AS NotificationId,

                n.borrowing_id AS BorrowingId,

                b.title AS BookTitle,

                n.message AS Message,

                n.is_read AS IsRead,

                n.created_at AS CreatedAt

            FROM notifications n

            LEFT JOIN borrowings br
                ON n.borrowing_id = br.borrowing_id

            LEFT JOIN books b
                ON br.book_id = b.book_id

            WHERE n.recipient_user_id = @UserId

            ORDER BY n.created_at DESC;
            """;

        return await connection.QueryAsync<UserNotificationResponse>(
            sql,
            new
            {
                UserId = userId
            }
        );
    }

    // =========================================================
    // MARK NOTIFICATION AS READ
    // =========================================================

    public async Task<bool> MarkNotificationAsReadAsync(
        Guid userId,
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE notifications

            SET is_read = TRUE

            WHERE notification_id = @NotificationId
              AND recipient_user_id = @UserId;
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    NotificationId = notificationId,
                    UserId = userId
                }
            );

        return rows > 0;
    }

    // =========================================================
    // MARK ALL NOTIFICATIONS AS READ
    // =========================================================

    public async Task<bool> MarkAllNotificationsAsReadAsync(
        Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE notifications
            SET is_read = TRUE
            WHERE recipient_user_id = @UserId
              AND is_read = FALSE;
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    UserId = userId
                }
            );

        return rows > 0;
    }

    // =========================================================
    // MARK NOTIFICATION AS UNREAD
    // =========================================================

    public async Task<bool> MarkNotificationAsUnreadAsync(
        Guid userId,
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE notifications

            SET is_read = FALSE

            WHERE notification_id = @NotificationId
              AND recipient_user_id = @UserId;
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    NotificationId = notificationId,
                    UserId = userId
                }
            );

        return rows > 0;
    }

    // =========================================================
    // DELETE NOTIFICATION
    // =========================================================

    public async Task<bool> DeleteNotificationAsync(
        Guid userId,
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            DELETE FROM notifications

            WHERE notification_id = @NotificationId
              AND recipient_user_id = @UserId;
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    NotificationId = notificationId,
                    UserId = userId
                }
            );

        return rows > 0;
    }

    // =========================================================
    // UNREAD NOTIFICATION COUNT
    // =========================================================

    public async Task<int> GetUnreadNotificationCountAsync(
        Guid userId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT COUNT(*)

            FROM notifications

            WHERE recipient_user_id = @UserId
              AND is_read = FALSE;
            """;

        return await connection.ExecuteScalarAsync<int>(
            sql,
            new
            {
                UserId = userId
            }
        );
    }

    // =========================================================
    // FEEDBACK
    // =========================================================

    public async Task<bool> SubmitFeedbackAsync(
        Guid userId,
        string feedback)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            INSERT INTO feedback
            (
                user_id,
                feedback
            )
            VALUES
            (
                @UserId,
                @Feedback
            );
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    UserId = userId,
                    Feedback = feedback
                }
            );

        return rows > 0;
    }

    // =========================================================
    // CREATE BOOK RETURNED NOTIFICATION
    // =========================================================

    public async Task<bool> CreateBookReturnedNotificationAsync(
        Guid borrowingId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            INSERT INTO notifications
            (
                user_id,
                recipient_user_id,
                borrowing_id,
                notification_type,
                message,
                is_read,
                created_at
            )
            SELECT
                br.user_id,
                br.user_id,
                br.borrowing_id,
                'BookReturned',

                'You have successfully returned "' ||
                    b.title ||
                    '". Thank you.',

                FALSE,
                CURRENT_TIMESTAMP

            FROM borrowings br

            INNER JOIN books b
                ON br.book_id = b.book_id

            WHERE br.borrowing_id = @BorrowingId
              AND br.return_date IS NOT NULL

              AND NOT EXISTS
              (
                  SELECT 1

                  FROM notifications n

                  WHERE n.borrowing_id = br.borrowing_id
                    AND n.recipient_user_id = br.user_id
                    AND n.notification_type = 'BookReturned'
              )

            RETURNING notification_id;
            """;

        var notificationId =
            await connection.QuerySingleOrDefaultAsync<Guid?>(
                sql,
                new
                {
                    BorrowingId = borrowingId
                }
            );

        return notificationId.HasValue;
    }

    // =========================================================
    // CREATE BOOK AVAILABILITY NOTIFICATION FOR ADMIN
    // =========================================================

    public async Task<bool> CreateBookAvailabilityNotificationAsync(
        Guid userId,
        Guid bookId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            INSERT INTO notifications
            (
                user_id,
                recipient_user_id,
                borrowing_id,
                notification_type,
                message,
                is_read,
                created_at
            )
            SELECT
                @UserId,
                admin.user_id,
                NULL,
                'BookAvailabilityRequest',
                u.name ||
                    ' requested a notification when "' ||
                    b.title ||
                    '" becomes available.',
                FALSE,
                CURRENT_TIMESTAMP

            FROM users u

            INNER JOIN books b
                ON b.book_id = @BookId

            CROSS JOIN LATERAL
            (
                SELECT au.user_id
                FROM users au
                INNER JOIN roles ar
                    ON au.role_id = ar.role_id
                WHERE LOWER(ar.role_name) = 'admin'
                  AND au.is_active = TRUE
                  AND au.is_deleted = FALSE
                LIMIT 1
            ) admin

            WHERE u.user_id = @UserId
              AND u.is_active = TRUE
              AND u.is_deleted = FALSE
              AND b.is_deleted = FALSE

            RETURNING notification_id;
            """;

        var notificationId =
            await connection.QuerySingleOrDefaultAsync<Guid?>(
                sql,
                new
                {
                    UserId = userId,
                    BookId = bookId
                }
            );

        return notificationId.HasValue;
    }

    // =========================================================
    // UPDATE PROFILE
    // =========================================================

    public async Task<bool> UpdateProfileAsync(
        Guid userId,
        UpdateProfileRequest request)
    {
        using var connection = _context.CreateConnection();

        // =====================================================
        // VERIFY CURRENT PASSWORD
        // =====================================================

        const string passwordSql = """
            SELECT password_hash
            FROM users
            WHERE user_id = @UserId
              AND is_active = TRUE
              AND is_deleted = FALSE;
            """;

        var passwordHash =
            await connection.ExecuteScalarAsync<string?>(
                passwordSql,
                new
                {
                    UserId = userId
                }
            );

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        if (!BCrypt.Net.BCrypt.Verify(
                request.CurrentPassword,
                passwordHash))
        {
            throw new InvalidOperationException(
                "Current password is incorrect."
            );
        }

        // =====================================================
        // CHECK DUPLICATE USERNAME
        // =====================================================

        const string duplicateUsernameSql = """
            SELECT COUNT(*)
            FROM users
            WHERE LOWER(username) = LOWER(@Username)
              AND user_id <> @UserId
              AND is_deleted = FALSE;
            """;

        var usernameExists =
            await connection.ExecuteScalarAsync<int>(
                duplicateUsernameSql,
                new
                {
                    UserId = userId,
                    Username = request.Username.Trim()
                }
            );

        if (usernameExists > 0)
        {
            throw new InvalidOperationException(
                "Username already exists."
            );
        }

        // =====================================================
        // CHECK DUPLICATE EMAIL
        // =====================================================

        const string duplicateEmailSql = """
            SELECT COUNT(*)
            FROM users
            WHERE LOWER(email) = LOWER(@Email)
              AND user_id <> @UserId
              AND is_deleted = FALSE;
            """;

        var emailExists =
            await connection.ExecuteScalarAsync<int>(
                duplicateEmailSql,
                new
                {
                    UserId = userId,
                    Email = request.Email.Trim()
                }
            );

        if (emailExists > 0)
        {
            throw new InvalidOperationException(
                "Email already exists."
            );
        }

        // =====================================================
        // UPDATE USERNAME + EMAIL + PHONE
        // =====================================================

        const string sql = """
            UPDATE users
            SET
                username = @Username,
                email = @Email,
                phone = @Phone,
                updated_at = CURRENT_TIMESTAMP

            WHERE user_id = @UserId
              AND is_deleted = FALSE;
            """;

        var rows =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    UserId = userId,
                    Username = request.Username.Trim(),
                    Email = request.Email.Trim(),
                    Phone = string.IsNullOrWhiteSpace(request.Phone)
                        ? null
                        : request.Phone.Trim()
                }
            );

        return rows > 0;
    }

    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    public async Task<bool> ChangePasswordAsync(
        Guid userId,
        ChangePasswordRequest request)
    {
        using var connection = _context.CreateConnection();

        // =====================================================
        // VALIDATE REQUEST
        // =====================================================

        if (request == null)
        {
            throw new InvalidOperationException(
                "Password change request is required."
            );
        }

        if (string.IsNullOrEmpty(request.CurrentPassword))
        {
            throw new InvalidOperationException(
                "Current password is required."
            );
        }

        if (string.IsNullOrEmpty(request.NewPassword))
        {
            throw new InvalidOperationException(
                "New password is required."
            );
        }

        if (request.CurrentPassword == request.NewPassword)
        {
            throw new InvalidOperationException(
                "New password must be different from the current password."
            );
        }

        // =====================================================
        // GET CURRENT PASSWORD HASH
        // =====================================================

        const string passwordSql = """
            SELECT password_hash
            FROM users
            WHERE user_id = @UserId
              AND is_active = TRUE
              AND is_deleted = FALSE;
            """;

        var passwordHash =
            await connection.ExecuteScalarAsync<string?>(
                passwordSql,
                new
                {
                    UserId = userId
                }
            );

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new InvalidOperationException(
                "User account was not found."
            );
        }

        // =====================================================
        // VERIFY CURRENT PASSWORD
        // =====================================================

        bool currentPasswordValid;

        try
        {
            currentPasswordValid =
                BCrypt.Net.BCrypt.Verify(
                    request.CurrentPassword,
                    passwordHash);
        }
        catch (Exception)
        {
            currentPasswordValid = false;
        }

        if (!currentPasswordValid)
        {
            throw new InvalidOperationException(
                "Current password is incorrect."
            );
        }

        // =====================================================
        // HASH NEW PASSWORD
        // =====================================================

        var newPasswordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.NewPassword,
                11
            );

        // =====================================================
        // UPDATE PASSWORD
        // =====================================================

        const string updateSql = """
            UPDATE users
            SET
                password_hash = @PasswordHash,
                updated_at = CURRENT_TIMESTAMP

            WHERE user_id = @UserId
              AND is_active = TRUE
              AND is_deleted = FALSE;
            """;

        var rows =
            await connection.ExecuteAsync(
                updateSql,
                new
                {
                    UserId = userId,
                    PasswordHash = newPasswordHash
                }
            );

        return rows > 0;
    }

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    // =========================================================
    // DELETE ACCOUNT
    // =========================================================

    public async Task<bool> DeleteAccountAsync(
        Guid userId,
        DeleteAccountRequest request)
    {
        using var connection = _context.CreateConnection();

        // =====================================================
        // CHECK USER ACCOUNT + PASSWORD
        // =====================================================

        const string userSql = """
        SELECT password_hash
        FROM users
        WHERE user_id = @UserId
          AND is_active = TRUE
          AND is_deleted = FALSE;
        """;

        var passwordHash =
            await connection.ExecuteScalarAsync<string?>(
                userSql,
                new
                {
                    UserId = userId
                }
            );

        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            return false;
        }

        // =====================================================
        // CHECK UNRETURNED BOOKS
        // =====================================================

        const string unreturnedBooksSql = """
        SELECT COUNT(*)
        FROM borrowings
        WHERE user_id = @UserId
          AND return_date IS NULL;
        """;

        var unreturnedBooks =
            await connection.ExecuteScalarAsync<int>(
                unreturnedBooksSql,
                new
                {
                    UserId = userId
                }
            );

        // =====================================================
        // BLOCK ACCOUNT DELETION IF ANY BOOK IS NOT RETURNED
        // =====================================================

        if (unreturnedBooks > 0)
        {
            throw new InvalidOperationException(
                "You cannot delete your account because you still have borrowed books. Please return all borrowed books first."
            );
        }

        // =====================================================
        // CHECK OUTSTANDING FINE
        // =====================================================

        const string fineSql = """
        SELECT
            COALESCE(
                SUM(
                    CASE
                        WHEN return_date IS NULL
                             AND due_date < CURRENT_TIMESTAMP
                        THEN
                            GREATEST(
                                FLOOR(
                                    EXTRACT(
                                        EPOCH FROM
                                        (
                                            CURRENT_TIMESTAMP - due_date
                                        )
                                    ) / 86400
                                ),
                                0
                            ) * @FinePerDay

                        ELSE 0
                    END
                ),
                0
            )
        FROM borrowings
        WHERE user_id = @UserId;
        """;

        var outstandingFine =
            await connection.ExecuteScalarAsync<decimal>(
                fineSql,
                new
                {
                    UserId = userId,
                    FinePerDay
                }
            );

        // =====================================================
        // BLOCK ACCOUNT DELETION IF FINE EXISTS
        // =====================================================

        if (outstandingFine > 0)
        {
            throw new InvalidOperationException(
                $"You cannot delete your account because you have an outstanding fine of ₹{outstandingFine:0.00}. Please clear the fine first."
            );
        }

        // =====================================================
        // VERIFY PASSWORD
        // =====================================================

        bool passwordValid;

        try
        {
            passwordValid =
                BCrypt.Net.BCrypt.Verify(
                    request.Password,
                    passwordHash
                );
        }
        catch
        {
            passwordValid = false;
        }

        if (!passwordValid)
        {
            throw new InvalidOperationException(
                "Password is incorrect."
            );
        }

        // =====================================================
        // SOFT DELETE ACCOUNT
        // =====================================================

        const string deleteSql = """
        UPDATE users
        SET
            is_deleted = TRUE,
            is_active = FALSE,
            deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP

        WHERE user_id = @UserId
          AND is_active = TRUE
          AND is_deleted = FALSE
          AND NOT EXISTS
          (
              SELECT 1
              FROM borrowings
              WHERE borrowings.user_id = users.user_id
                AND borrowings.return_date IS NULL
          );
        """;

        var rows =
            await connection.ExecuteAsync(
                deleteSql,
                new
                {
                    UserId = userId
                }
            );

        if (rows == 0)
        {
            throw new InvalidOperationException(
                "Your account cannot be deleted because you still have borrowed books."
            );
        }

        return true;
    }

    // =========================================================
    // LIBRARY CHATBOT
    // =========================================================

    // =========================================================
    // LIBRARY CHATBOT
    // =========================================================

    // =========================================================
    // LIBRARY CHATBOT
    // =========================================================

    // =========================================================
    // HIGH-END LIBRARY CHATBOT
    // =========================================================

    public async Task<string> ChatbotAsync(
     Guid userId,
     string message)
    {
        using var connection = _context.CreateConnection();

        message = message.Trim();

        if (string.IsNullOrWhiteSpace(message))
        {
            return "Sure 😊 What book or library information are you looking for?";
        }

        var normalized = message.ToLowerInvariant();

        // =====================================================
        // FRIENDLY CONVERSATION
        // =====================================================

        if (IsGreeting(normalized))
        {
            return "Hello! 👋 I'm your Library Assistant 📚\n\n" +
                   "Tell me what you're looking for. You can ask me about a book, " +
                   "author, genre, availability, borrowing, returns, fines, or due dates.";
        }

        if (IsThanks(normalized))
        {
            return "You're very welcome! 😊📚 Let me know if you need help finding another book.";
        }

        if (IsHowAreYou(normalized))
        {
            return "I'm doing great! 😄📚 Ready to help you find a good book.";
        }

        // =====================================================
        // BOOK COUNT
        // =====================================================

        if (ContainsAny(normalized,
            "how many books",
            "number of books",
            "total books",
            "how many books are there"))
        {
            const string countSql = """
            SELECT COUNT(*)
            FROM books
            WHERE is_deleted = FALSE;
            """;

            var count = await connection.ExecuteScalarAsync<int>(countSql);

            return $"We currently have {count} books in the library. 📚";
        }

        // =====================================================
        // CATEGORY SEARCH
        // =====================================================

        if (ContainsAny(normalized,
            "history books",
            "history book",
            "books about history"))
        {
            return await SearchBooksAsync(
                connection,
                "history",
                "Here are some history books I found:"
            );
        }

        if (ContainsAny(normalized,
            "science books",
            "science book"))
        {
            return await SearchBooksAsync(
                connection,
                "science",
                "Here are some science books I found:"
            );
        }

        if (ContainsAny(normalized,
            "fiction books",
            "fiction book"))
        {
            return await SearchBooksAsync(
                connection,
                "fiction",
                "Here are some fiction books I found:"
            );
        }

        // =====================================================
        // AVAILABILITY QUESTIONS
        // =====================================================

        if (ContainsAny(normalized,
            "available",
            "in stock",
            "stock",
            "have this book",
            "do you have"))
        {
            var searchText = ExtractAvailabilityBookName(normalized);

            var books = await SearchBooksDetailedAsync(
                connection,
                searchText
            );

            if (books.Count == 0)
            {
                return "I couldn't find that book in our library. 📚\n\n" +
                       "If you give me the title, author, or a few details about the book, I'll try to find a match.";
            }

            return BuildBookResponse(
                books,
                "I found these books in our library:"
            );
        }

        // =====================================================
        // AVAILABLE COPIES QUESTIONS
        // =====================================================

        if (ContainsAny(
            normalized,
            "how many copies",
            "how many copy",
            "number of copies",
            "copies available",
            "available copies",
            "how many are available"))
        {
            var copySearchText =
                ExtractAvailableCopiesBookName(normalized);

            var books = await SearchBooksDetailedAsync(
                connection,
                copySearchText
            );

            if (books.Count == 0)
            {
                return
                    "I couldn't find that book in our library. 📚\n\n" +
                    "Please give me the book title or author name, and I'll try to find it.";
            }

            var book = books.First();

            if (book.AvailableCopies > 0)
            {
                return
                    $"📖 **{book.Title}**\n" +
                    $"Author: {book.Author}\n" +
                    $"Category: {book.CategoryName ?? "Not specified"}\n" +
                    $"Available copies: **{book.AvailableCopies}** ✅\n\n" +
                    $"Yes, **{book.Title}** has **{book.AvailableCopies} " +
                    $"{(book.AvailableCopies == 1 ? "copy" : "copies")}** available in our library. 📚";
            }

            return
                $"📖 **{book.Title}**\n" +
                $"Author: {book.Author}\n" +
                $"Category: {book.CategoryName ?? "Not specified"}\n" +
                $"Available copies: **0** ❌\n\n" +
                $"Sorry, **{book.Title}** is currently unavailable.";
        }

        // =====================================================
        // AUTHOR QUESTIONS
        // =====================================================

        if (ContainsAny(
            normalized,
            "who wrote",
            "who is the author of",
            "who is author of",
            "author of",
            "written by"))
        {
            var authorSearchText =
                ExtractAuthorBookName(normalized);

            var books = await SearchBooksDetailedAsync(
                connection,
                authorSearchText
            );

            if (books.Count > 0)
            {
                var book = books.First();

                return
                    $"📖 {book.Title}\n" +
                    $"Author: {book.Author}\n\n" +
                    $"Yes, **{book.Author}** wrote \"{book.Title}\". 📚";
            }

            return
                $"I couldn't find that book in our library. 📚\n\n" +
                "Try giving me the book title or author name.";
        }

        // =====================================================
        // SIMILAR BOOK REQUEST
        // =====================================================

        if (ContainsAny(normalized,
            "like",
            "similar to",
            "similar book",
            "books like",
            "something like",
            "recommend",
            "recommend me",
            "suggest me",
            "suggest a book",
            "books similar"))
        {
            var searchText = ExtractBookSearchText(normalized);

            var referenceBooks = await SearchBooksDetailedAsync(
                connection,
                searchText
            );

            if (referenceBooks.Count > 0)
            {
                var reference = referenceBooks.First();

                var recommendations =
                    await GetSimilarBooksAsync(
                        connection,
                        reference
                    );

                if (recommendations.Count > 0)
                {
                    var response =
                        $"If you liked **{reference.Title}**, you may also like these books: 📚\n\n";

                    foreach (var book in recommendations)
                    {
                        response +=
                            $"📖 {book.Title}\n" +
                            $"Author: {book.Author}\n" +
                            $"Category: {book.CategoryName ?? "Not specified"}\n" +
                            $"Available copies: {book.AvailableCopies}\n\n";
                    }

                    return response.Trim();
                }

                return
                    $"I found **{reference.Title}**, but I couldn't find closely related books in our current collection.";
            }

            return
                "Tell me the name of the book you like, and I'll look for similar books in our library. 📚";
        }

        // =====================================================
        // BORROW BOOK INTENT
        // =====================================================

        if (ContainsAny(
            normalized,
            "i want to borrow",
            "i want borrow",
            "i need to borrow",
            "i need borrow",
            "borrow this",
            "borrow the book",
            "can i borrow",
            "let me borrow"))
        {
            var borrowSearchText =
                ExtractBorrowBookName(normalized);

            var books = await SearchBooksDetailedAsync(
                connection,
                borrowSearchText
            );

            if (books.Count == 0)
            {
                return
                    $"I couldn't find \"{borrowSearchText}\" in our library. 📚\n\n" +
                    "Please check the book title or tell me the author.";
            }

            var book = books.First();

            if (book.AvailableCopies > 0)
            {
                return
                    $"📖 **{book.Title}**\n" +
                    $"Author: {book.Author}\n" +
                    $"Category: {book.CategoryName ?? "Not specified"}\n" +
                    $"Available copies: {book.AvailableCopies} ✅\n\n" +
                    $"Yes, **{book.Title}** is available to borrow. 📚";
            }

            return
                $"📖 **{book.Title}**\n" +
                $"Author: {book.Author}\n\n" +
                "Unfortunately, this book is currently unavailable. ❌\n\n" +
                "You can request a notification when a copy becomes available.";
        }

        // =====================================================
        // USER DUE DATE / FINE QUESTIONS
        // =====================================================

        if (ContainsAny(
            normalized,
            "is there any due for me",
            "any due for me",
            "what is due for me",
            "when is my book due",
            "when are my books due",
            "my due date",
            "my due dates",
            "do i have any due",
            "do i have a due"))
        {
            const string sql = """
        SELECT
            b.title AS Title,
            br.due_date AS DueDate,
            CASE
                WHEN br.due_date < CURRENT_TIMESTAMP
                    THEN
                        GREATEST(
                            FLOOR(
                                EXTRACT(
                                    EPOCH FROM
                                    (CURRENT_TIMESTAMP - br.due_date)
                                ) / 86400
                            ),
                            0
                        ) * @FinePerDay
                ELSE 0
            END AS Fine
        FROM borrowings br
        INNER JOIN books b
            ON br.book_id = b.book_id
        WHERE br.user_id = @UserId
          AND br.return_date IS NULL
        ORDER BY br.due_date ASC;
        """;

            var dueBooks =
                (await connection.QueryAsync<UserChatbotDueBook>(
                    sql,
                    new
                    {
                        UserId = userId,
                        FinePerDay
                    }
                )).ToList();

            if (dueBooks.Count == 0)
            {
                return "You don't currently have any borrowed books. 📚";
            }

            var response =
                "Here are your current borrowed books and due dates: 📅\n\n";

            foreach (var book in dueBooks)
            {
                if (book.DueDate < DateTime.Now)
                {
                    response +=
                        $"📖 {book.Title}\n" +
                        $"Due: {book.DueDate:dd MMM yyyy, hh:mm tt}\n" +
                        $"Status: Overdue ⚠️\n" +
                        $"Current fine: ₹{book.Fine:0.00}\n\n";
                }
                else
                {
                    response +=
                        $"📖 {book.Title}\n" +
                        $"Due: {book.DueDate:dd MMM yyyy, hh:mm tt}\n" +
                        $"Status: Due Soon / Borrowed ✅\n\n";
                }
            }

            return response.Trim();
        }
        // =====================================================
        // USER BORROWING STATUS / PENDING BOOKS
        // =====================================================

        if (ContainsAny(
            normalized,
            "any borrowed book",
            "any borrowed books",
            "borrowed book",
            "borrowed books",
            "my borrowed book",
            "my borrowed books",
            "books i borrowed",
            "book i borrowed",
            "pending book",
            "pending books",
            "borrowing pending",
            "borrow pending",
            "currently borrowed"))
        {
            const string sql = """
        SELECT
            b.title AS Title,
            b.author AS Author,
            br.start_date AS BorrowedDate,
            br.due_date AS DueDate,
            br.status AS Status
        FROM borrowings br
        INNER JOIN books b
            ON br.book_id = b.book_id
        WHERE br.user_id = @UserId
          AND br.return_date IS NULL
        ORDER BY br.start_date DESC;
        """;

            var borrowedBooks =
                (await connection.QueryAsync<UserChatbotBorrowedBook>(
                    sql,
                    new
                    {
                        UserId = userId
                    }
                )).ToList();

            if (borrowedBooks.Count == 0)
            {
                return
                    "You don't have any currently borrowed or pending books. 📚";
            }

            var response =
                "Yes 😊 You currently have these books with you:\n\n";

            foreach (var book in borrowedBooks)
            {
                response +=
                    $"📖 {book.Title}\n" +
                    $"Author: {book.Author}\n" +
                    $"Borrowed: {book.BorrowedDate:dd MMM yyyy}\n" +
                    $"Due: {book.DueDate:dd MMM yyyy, hh:mm tt}\n" +
                    $"Status: {book.Status}\n\n";
            }

            return response.Trim();
        }



        // =====================================================
        // GENERAL / VAGUE BOOK SEARCH
        // =====================================================

        var search = CleanSearchText(normalized);

        var results = await SearchBooksDetailedAsync(
            connection,
            search
        );

        if (results.Count > 0)
        {
            return BuildBookResponse(
                results,
                "I found these books that may be useful for you: 📚"
            );
        }

        // Try searching individual meaningful words
        var keywords = search
            .Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries
            )
            .Where(x => x.Length >= 4)
            .Distinct()
            .Take(5)
            .ToList();

        var combinedResults =
            new List<ChatbotBookResult>();

        foreach (var keyword in keywords)
        {
            var keywordResults =
                await SearchBooksDetailedAsync(
                    connection,
                    keyword
                );

            foreach (var book in keywordResults)
            {
                if (!combinedResults.Any(
                    x => x.BookId == book.BookId))
                {
                    combinedResults.Add(book);
                }
            }
        }

        if (combinedResults.Count > 0)
        {
            return BuildBookResponse(
                combinedResults.Take(5).ToList(),
                "I found some books that may match what you're looking for: 📚"
            );
        }



        // =====================================================
        // GENERAL LIBRARY CONVERSATION
        // =====================================================

        if (ContainsAny(normalized,
            "borrow",
            "borrowing",
            "return book",
            "returning",
            "fine",
            "due date",
            "notification",
            "history"))
        {
            return
                "I can help with that. 📚\n\n" +
                "You can ask me something specific, such as:\n" +
                "• What books have I borrowed?\n" +
                "• When is my book due?\n" +
                "• Do I have any fines?\n" +
                "• What is my borrowing history?";
        }

        // =====================================================
        // FRIENDLY FALLBACK
        // =====================================================

        return
            "I can help you find books and information from our library. 📚\n\n" +
            "Try telling me:\n" +
            "• A book title or author\n" +
            "• A type of book you want\n" +
            "• A book you want something similar to\n" +
            "• Whether a book is available\n\n" +
            "For example: \"I want a book like Atomic Habits\".";
    }


    // =========================================================
    // EXTRACT BOOK NAME FROM BORROW QUESTION
    // =========================================================

    private string ExtractBorrowBookName(string message)
    {
        var phrases = new[]
        {
        "i want to borrow",
        "i want borrow",
        "i need to borrow",
        "i need borrow",
        "borrow this book",
        "borrow the book",
        "borrow this",
        "can i borrow",
        "let me borrow"
    };

        foreach (var phrase in phrases)
        {
            var index = message.IndexOf(
                phrase,
                StringComparison.OrdinalIgnoreCase
            );

            if (index >= 0)
            {
                var result =
                    message[(index + phrase.Length)..]
                        .Trim()
                        .Trim('?', '.', '!', '"', '\'');

                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
        }

        return message
            .Trim()
            .Trim('?', '.', '!', '"', '\'');
    }


    // =========================================================
    // EXTRACT BOOK NAME FROM AVAILABILITY QUESTION
    // =========================================================

    private string ExtractAvailabilityBookName(string message)
    {
        var phrases = new[]
        {
        "do you have",
        "do you have the book",
        "is there",
        "is the book",
        "is",
        "available",
        "availability of",
        "availability"
    };

        foreach (var phrase in phrases)
        {
            var index = message.IndexOf(
                phrase,
                StringComparison.OrdinalIgnoreCase
            );

            if (index >= 0)
            {
                var result =
                    message[(index + phrase.Length)..]
                        .Trim()
                        .Trim('?', '.', '!', '"', '\'');

                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
        }

        return message
            .Trim()
            .Trim('?', '.', '!', '"', '\'');
    }


    // =========================================================
    // EXTRACT BOOK NAME FROM AVAILABLE COPIES QUESTION
    // =========================================================

    private string ExtractAvailableCopiesBookName(string message)
    {
        var phrases = new[]
        {
        "how many copies are available in",
        "how many copies are available for",
        "how many copies are available of",
        "how many copies available in",
        "how many copies available for",
        "how many copies available of",
        "how many copies does",
        "how many copies of",
        "number of copies of",
        "copies available in",
        "copies available for",
        "available copies of",
        "how many are available in",
        "how many are available for"
    };

        foreach (var phrase in phrases)
        {
            var index = message.IndexOf(
                phrase,
                StringComparison.OrdinalIgnoreCase
            );

            if (index >= 0)
            {
                var result =
                    message[(index + phrase.Length)..]
                        .Trim()
                        .Trim('?', '.', '!', '"', '\'');

                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
        }

        return CleanSearchText(message)
            .Replace("how many copies", "")
            .Replace("how many copy", "")
            .Replace("copies available", "")
            .Replace("available copies", "")
            .Replace("how many are available", "")
            .Trim();
    }

    // =========================================================
    // SEARCH BOOKS
    // =========================================================

    private async Task<List<ChatbotBookResult>>
        SearchBooksDetailedAsync(
            System.Data.IDbConnection connection,
            string searchText)
    {
        if (string.IsNullOrWhiteSpace(searchText))
        {
            return new List<ChatbotBookResult>();
        }

        const string sql = """
        SELECT
            b.book_id AS BookId,
            b.title AS Title,
            b.author AS Author,
            b.description AS Description,
            b.publisher AS Publisher,
            b.published_year AS PublishedYear,
            b.available_copies AS AvailableCopies,
            b.total_copies AS TotalCopies,
            c.category_name AS CategoryName

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        WHERE b.is_deleted = FALSE
          AND
          (
              LOWER(b.title) LIKE '%' || LOWER(@SearchText) || '%'
              OR LOWER(b.author) LIKE '%' || LOWER(@SearchText) || '%'
              OR LOWER(COALESCE(b.description, ''))
                    LIKE '%' || LOWER(@SearchText) || '%'
              OR LOWER(COALESCE(b.publisher, ''))
                    LIKE '%' || LOWER(@SearchText) || '%'
              OR LOWER(COALESCE(c.category_name, ''))
                    LIKE '%' || LOWER(@SearchText) || '%'
          )

        ORDER BY
            CASE
                WHEN LOWER(b.title) = LOWER(@SearchText)
                    THEN 1

                WHEN LOWER(b.title) LIKE
                    '%' || LOWER(@SearchText) || '%'
                    THEN 2

                WHEN LOWER(b.author) LIKE
                    '%' || LOWER(@SearchText) || '%'
                    THEN 3

                WHEN LOWER(COALESCE(c.category_name, '')) LIKE
                    '%' || LOWER(@SearchText) || '%'
                    THEN 4

                ELSE 5
            END,

            b.title

        LIMIT 5;
        """;

        var books =
            await connection.QueryAsync<ChatbotBookResult>(
                sql,
                new
                {
                    SearchText = searchText
                }
            );

        return books.ToList();
    }


    // =========================================================
    // SIMILAR BOOKS
    // =========================================================

    private async Task<List<ChatbotBookResult>>
        GetSimilarBooksAsync(
            System.Data.IDbConnection connection,
            ChatbotBookResult reference)
    {
        const string sql = """
        SELECT
            b.book_id AS BookId,
            b.title AS Title,
            b.author AS Author,
            b.description AS Description,
            b.publisher AS Publisher,
            b.published_year AS PublishedYear,
            b.available_copies AS AvailableCopies,
            b.total_copies AS TotalCopies,
            c.category_name AS CategoryName

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        WHERE b.is_deleted = FALSE
          AND LOWER(b.title) <> LOWER(@Title)

          AND
          (
              (
                  @CategoryName IS NOT NULL
                  AND LOWER(COALESCE(c.category_name, ''))
                      = LOWER(@CategoryName)
              )

              OR

              (
                  @Description IS NOT NULL
                  AND
                  (
                      LOWER(COALESCE(b.description, ''))
                          LIKE '%' ||
                          LOWER(@Description) ||
                          '%'

                      OR

                      LOWER(COALESCE(b.title, ''))
                          LIKE '%' ||
                          LOWER(@Description) ||
                          '%'
                  )
              )
          )

        ORDER BY
            CASE
                WHEN LOWER(COALESCE(c.category_name, ''))
                    = LOWER(@CategoryName)
                    THEN 1
                ELSE 2
            END,

            CASE
                WHEN b.available_copies > 0
                    THEN 1
                ELSE 2
            END,

            b.title

        LIMIT 5;
        """;

        var descriptionKeyword =
            GetDescriptionKeyword(reference.Description);

        var books =
            await connection.QueryAsync<ChatbotBookResult>(
                sql,
                new
                {
                    Title = reference.Title,
                    CategoryName = reference.CategoryName,
                    Description = descriptionKeyword
                }
            );

        return books.ToList();
    }


    // =========================================================
    // BUILD RESPONSE
    // =========================================================

    private string BuildBookResponse(
        List<ChatbotBookResult> books,
        string heading)
    {
        var response = heading + "\n\n";

        foreach (var book in books)
        {
            var availability =
                book.AvailableCopies > 0
                    ? $"Available copies: {book.AvailableCopies} ✅"
                    : "Currently unavailable ❌";

            response +=
                $"📖 {book.Title}\n" +
                $"Author: {book.Author}\n" +
                $"Category: {book.CategoryName ?? "Not specified"}\n" +
                $"Published: {book.PublishedYear?.ToString() ?? "Not specified"}\n" +
                $"{availability}\n\n";
        }

        return response.Trim();
    }


    // =========================================================
    // CATEGORY SEARCH
    // =========================================================

    private async Task<string> SearchBooksAsync(
        System.Data.IDbConnection connection,
        string category,
        string heading)
    {
        var books =
            await SearchBooksDetailedAsync(
                connection,
                category
            );

        if (books.Count == 0)
        {
            return $"I couldn't find any {category} books in our current collection.";
        }

        return BuildBookResponse(
            books,
            heading
        );
    }


    // =========================================================
    // CLEAN SEARCH TEXT
    // =========================================================

    private string CleanSearchText(string message)
    {
        var words = message
            .Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries
            )
            .Where(word =>
                !ChatbotStopWords.Contains(word))
            .ToList();

        return string.Join(" ", words);
    }


    // =========================================================
    // EXTRACT BOOK SEARCH TEXT
    // =========================================================

    private string ExtractBookSearchText(string message)
    {
        var phrases = new[]
        {
        "similar to",
        "similar book to",
        "books like",
        "book like",
        "something like",
        "recommend me",
        "recommend",
        "suggest me",
        "suggest"
    };

        foreach (var phrase in phrases)
        {
            var index = message.IndexOf(
                phrase,
                StringComparison.OrdinalIgnoreCase
            );

            if (index >= 0)
            {
                var result =
                    message[(index + phrase.Length)..]
                        .Trim();

                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
        }

        return CleanSearchText(message);
    }


    // =========================================================
    // EXTRACT BOOK NAME FROM AUTHOR QUESTION
    // =========================================================

    private string ExtractAuthorBookName(string message)
    {
        var phrases = new[]
        {
        "who is the author of",
        "who is author of",
        "who wrote",
        "author of",
        "written by"
    };

        foreach (var phrase in phrases)
        {
            var index = message.IndexOf(
                phrase,
                StringComparison.OrdinalIgnoreCase
            );

            if (index >= 0)
            {
                var result =
                    message[(index + phrase.Length)..]
                        .Trim()
                        .Trim('?', '.', '!', '"', '\'');

                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
        }

        return message
            .Trim()
            .Trim('?', '.', '!', '"', '\'');
    }


    // =========================================================
    // DESCRIPTION KEYWORD
    // =========================================================

    private string? GetDescriptionKeyword(
        string? description)
    {
        if (string.IsNullOrWhiteSpace(description))
        {
            return null;
        }

        var words = description
            .Split(
                ' ',
                StringSplitOptions.RemoveEmptyEntries
            )
            .Where(word => word.Length >= 5)
            .Take(2)
            .ToArray();

        return words.Length == 0
            ? null
            : string.Join(" ", words);
    }


    // =========================================================
    // INTENT HELPERS
    // =========================================================

    private bool IsGreeting(string message)
    {
        return ContainsAny(
            message,
            "hello",
            "hi",
            "hey",
            "good morning",
            "good afternoon",
            "good evening"
        );
    }

    private bool IsThanks(string message)
    {
        return ContainsAny(
            message,
            "thanks",
            "thank you",
            "thankyou"
        );
    }

    private bool IsHowAreYou(string message)
    {
        return ContainsAny(
            message,
            "how are you",
            "how r u",
            "are you okay"
        );
    }

    private bool ContainsAny(
        string message,
        params string[] values)
    {
        return values.Any(
            value => message.Contains(
                value,
                StringComparison.OrdinalIgnoreCase
            )
        );
    }


    // =========================================================
    // CHATBOT STOP WORDS
    // =========================================================

    private static readonly HashSet<string>
        ChatbotStopWords =
            new(StringComparer.OrdinalIgnoreCase)
            {
            "i",
            "want",
            "a",
            "an",
            "the",
            "book",
            "books",
            "me",
            "please",
            "find",
            "give",
            "show",
            "can",
            "you",
            "do",
            "have",
            "is",
            "there",
            "any",
            "available",
            "availability",
            "stock",
            "in",
            "library",
            "for",
            "of",
            "to",
            "my",
            "some",
            "something",
            "recommend",
            "recommendation",
            "suggest",
            "suggestion",
            "like",
            "similar",
            "one"
            };
}

public class UserDeleteRestriction
{
    public int UnreturnedBooks { get; set; }

    public decimal OutstandingFine { get; set; }
}

public class ChatbotBookResult
{
    public Guid BookId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? Publisher { get; set; }

    public int? PublishedYear { get; set; }

    public int AvailableCopies { get; set; }

    public int TotalCopies { get; set; }

    public string? CategoryName { get; set; }
}


public class UserChatbotDueBook
{
    public string Title { get; set; } = string.Empty;

    public DateTime DueDate { get; set; }

    public decimal Fine { get; set; }
}

public class UserChatbotBorrowedBook
{
    public string Title { get; set; } = string.Empty;

    public string Author { get; set; } = string.Empty;

    public DateTime BorrowedDate { get; set; }

    public DateTime DueDate { get; set; }

    public string Status { get; set; } = string.Empty;
}