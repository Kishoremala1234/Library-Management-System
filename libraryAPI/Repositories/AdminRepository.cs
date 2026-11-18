using Npgsql;
using Dapper;
using LibraryAPI.Context;
using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly DapperContext _context;

    public AdminRepository(DapperContext context)
    {
        _context = context;
    }

    // =========================================================
    // ADMIN DASHBOARD
    // =========================================================

    public async Task<AdminDashboardResponse> GetDashboardAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                (
                    SELECT COUNT(*)
                    FROM books
                    WHERE is_deleted = FALSE
                ) AS TotalBooks,

                (
                    SELECT COUNT(*)
                    FROM users
                    WHERE is_deleted = FALSE
                ) AS TotalUsers,

                (
                    SELECT COUNT(*)
                    FROM borrowings
                    WHERE return_date IS NULL
                ) AS ActiveBorrowings,

                (
                    SELECT COUNT(*)
                    FROM borrowings
                    WHERE return_date IS NULL
                      AND due_date < CURRENT_TIMESTAMP
                ) AS OverdueBooks,

                (
                    SELECT COUNT(*)
                    FROM categories
                    WHERE is_deleted = FALSE
                ) AS TotalCategories;
            """;

        return await connection.QuerySingleAsync<AdminDashboardResponse>(
            sql
        );
    }

    // =========================================================
    // BOOKS
    // =========================================================

    public async Task<IEnumerable<AdminBookResponse>> GetBooksAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        SELECT
            b.book_id AS BookId,
            b.title AS Title,
            b.author AS Author,
            b.isbn AS Isbn,
            b.description AS Description,
            b.cover_image AS CoverImage,
            b.publisher AS Publisher,
            b.published_year AS PublishedYear,

            c.category_id AS CategoryId,
            c.category_name AS CategoryName,

            b.total_copies AS TotalCopies,
            b.available_copies AS AvailableCopies,
            COALESCE(NULLIF(b.amount, 0), ROUND(b.price)::int, 0) AS Amount,
            COALESCE(NULLIF(b.price, 0), b.amount, 0) AS Price

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        WHERE b.is_deleted = FALSE

        ORDER BY b.created_at DESC;
        """;

        return await connection.QueryAsync<AdminBookResponse>(sql);
    }

    public async Task<Guid> AddBookAsync(
        BookRequest request)
    {
        using var connection = _context.CreateConnection();

        const string checkTitleSql = """
        SELECT COUNT(*)
        FROM books
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(@Title))
          AND is_deleted = FALSE;
        """;

        var titleExists =
            await connection.ExecuteScalarAsync<int>(
                checkTitleSql,
                new
                {
                    request.Title
                }
            );

        if (titleExists > 0)
        {
            throw new InvalidOperationException(
                "A book with this title already exists."
            );
        }

        const string checkIsbnSql = """
        SELECT COUNT(*)
        FROM books
        WHERE TRIM(isbn) = TRIM(@Isbn)
          AND is_deleted = FALSE;
        """;

        var isbnExists =
            await connection.ExecuteScalarAsync<int>(
                checkIsbnSql,
                new
                {
                    request.Isbn
                }
            );

        if (isbnExists > 0)
        {
            throw new InvalidOperationException(
                "A book with this ISBN already exists."
            );
        }

        const string sql = """
        INSERT INTO books
        (
            title,
            author,
            isbn,
            description,
            cover_image,
            publisher,
            published_year,
            category_id,
            total_copies,
            available_copies,
            amount,
            price
        )
        VALUES
        (
            @Title,
            @Author,
            @Isbn,
            @Description,
            @CoverImage,
            @Publisher,
            @PublishedYear,
            @CategoryId,
            @TotalCopies,
            @AvailableCopies,
            @Amount,
            @Amount
        )
        RETURNING book_id;
        """;

        return await connection.ExecuteScalarAsync<Guid>(
            sql,
            new
            {
                request.Title,
                request.Author,
                request.Isbn,
                request.Description,
                request.CoverImage,
                request.Publisher,
                request.PublishedYear,
                request.CategoryId,
                request.TotalCopies,
                request.AvailableCopies,
                request.Amount
            }
        );
    }

    public async Task<bool> UpdateBookAsync(
        Guid bookId,
        BookRequest request)
    {
        using var connection = _context.CreateConnection();

        const string checkTitleSql = """
        SELECT COUNT(*)
        FROM books
        WHERE LOWER(TRIM(title)) = LOWER(TRIM(@Title))
          AND book_id <> @BookId
          AND is_deleted = FALSE;
        """;

        var titleExists =
            await connection.ExecuteScalarAsync<int>(
                checkTitleSql,
                new
                {
                    request.Title,
                    BookId = bookId
                }
            );

        if (titleExists > 0)
        {
            throw new InvalidOperationException(
                "A book with this title already exists."
            );
        }

        const string checkIsbnSql = """
        SELECT COUNT(*)
        FROM books
        WHERE isbn = @Isbn
          AND book_id <> @BookId
          AND is_deleted = FALSE;
        """;

        var isbnExists =
            await connection.ExecuteScalarAsync<int>(
                checkIsbnSql,
                new
                {
                    request.Isbn,
                    BookId = bookId
                }
            );

        if (isbnExists > 0)
        {
            throw new InvalidOperationException(
                "A book with this ISBN already exists."
            );
        }

        const string sql = """
        UPDATE books
        SET
            title = @Title,
            author = @Author,
            isbn = @Isbn,
            description = @Description,
            cover_image = @CoverImage,
            publisher = @Publisher,
            published_year = @PublishedYear,
            category_id = @CategoryId,
            total_copies = @TotalCopies,
            available_copies = @AvailableCopies,
            amount = @Amount,
            price = @Amount,
            updated_at = CURRENT_TIMESTAMP

        WHERE book_id = @BookId
          AND is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                BookId = bookId,
                request.Title,
                request.Author,
                request.Isbn,
                request.Description,
                request.CoverImage,
                request.Publisher,
                request.PublishedYear,
                request.CategoryId,
                request.TotalCopies,
                request.AvailableCopies,
                request.Amount
            }
        );

        return rows > 0;
    }

    public async Task<bool> DeleteBookAsync(
        Guid bookId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE books
            SET
                is_deleted = TRUE,
                deleted_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP

            WHERE book_id = @BookId
              AND is_deleted = FALSE;
            """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                BookId = bookId
            }
        );

        return rows > 0;
    }

    // =========================================================
    // CATEGORIES
    // =========================================================

    public async Task<IEnumerable<AdminCategoryResponse>> GetCategoriesAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                category_id AS CategoryId,
                category_name AS CategoryName

            FROM categories

            WHERE is_deleted = FALSE

            ORDER BY category_name;
            """;

        return await connection.QueryAsync<AdminCategoryResponse>(
            sql
        );
    }

    public async Task<Guid> AddCategoryAsync(
        CategoryRequest request)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        INSERT INTO categories
        (
            category_name
        )
        VALUES
        (
            @CategoryName
        )
        RETURNING category_id;
        """;

        try
        {
            return await connection.ExecuteScalarAsync<Guid>(
                sql,
                new
                {
                    CategoryName = request.CategoryName.Trim()
                }
            );
        }
        catch (PostgresException ex)
            when (ex.SqlState == "23505")
        {
            throw new InvalidOperationException(
                "Category already exists."
            );
        }
    }

    public async Task<bool> UpdateCategoryAsync(
        Guid categoryId,
        CategoryRequest request)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            UPDATE categories
            SET
                category_name = @CategoryName,
                updated_at = CURRENT_TIMESTAMP

            WHERE category_id = @CategoryId
              AND is_deleted = FALSE;
            """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                CategoryId = categoryId,
                request.CategoryName
            }
        );

        return rows > 0;
    }

    public async Task<bool> DeleteCategoryAsync(
        Guid categoryId)
    {
        using var connection =
            _context.CreateConnection();

        const string bookCountSql = """
        SELECT COUNT(*)
        FROM books
        WHERE category_id = @CategoryId
          AND is_deleted = FALSE;
        """;

        var bookCount =
            await connection.ExecuteScalarAsync<int>(
                bookCountSql,
                new
                {
                    CategoryId = categoryId
                });

        if (bookCount > 0)
        {
            throw new InvalidOperationException(
                $"Cannot delete this category because {bookCount} book(s) are assigned to it."
            );
        }

        const string deleteSql = """
        DELETE FROM categories
        WHERE category_id = @CategoryId;
        """;

        var rows =
            await connection.ExecuteAsync(
                deleteSql,
                new
                {
                    CategoryId = categoryId
                });

        return rows > 0;
    }

    // =========================================================
    // USERS
    // =========================================================

    public async Task<IEnumerable<AdminUserResponse>> GetUsersAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
    SELECT
        u.user_id AS UserId,
        u.username AS Username,
        u.name AS Name,
        u.email AS Email,
        u.phone AS Phone,
        r.role_name AS Role,
        u.is_active AS IsActive,

        COUNT(
            CASE
                WHEN br.return_date IS NULL
                THEN 1
            END
        ) AS NotReturned,

        COUNT(
            CASE
                WHEN br.return_date IS NULL
                 AND br.due_date < CURRENT_TIMESTAMP
                THEN 1
            END
        ) AS OverdueBooks,

        COALESCE(
            SUM(
                CASE
                    WHEN br.return_date IS NULL
                    THEN COALESCE(br.fine, 0)
                    ELSE 0
                END
            ),
            0
        ) AS OutstandingFine,

        CASE
            WHEN COUNT(
                CASE
                    WHEN br.return_date IS NULL
                    THEN 1
                END
            ) > 0
            THEN 'Borrowed'
            ELSE 'No Due'
        END AS BorrowingStatus

    FROM users u

    INNER JOIN roles r
        ON u.role_id = r.role_id

    LEFT JOIN borrowings br
        ON br.user_id = u.user_id

    WHERE u.is_deleted = FALSE

    GROUP BY
        u.user_id,
        u.username,
        u.name,
        u.email,
        u.phone,
        r.role_name,
        u.is_active,
        u.created_at

    ORDER BY u.created_at DESC;
    """;

        return await connection.QueryAsync<AdminUserResponse>(sql);
    }

    public async Task<bool> UpdateUserStatusAsync(
    Guid userId,
    bool isActive)
    {
        using var connection = _context.CreateConnection();

        // First check whether the user actually exists
        const string userExistsSql = """
        SELECT EXISTS
        (
            SELECT 1
            FROM users
            WHERE user_id = @UserId
              AND is_deleted = FALSE
        );
        """;

        var userExists = await connection.ExecuteScalarAsync<bool>(
            userExistsSql,
            new
            {
                UserId = userId
            }
        );

        if (!userExists)
        {
            return false;
        }

        // Update the user's active status
        const string sql = """
        UPDATE users
        SET
            is_active = @IsActive,
            updated_at = CURRENT_TIMESTAMP

        WHERE user_id = @UserId
          AND is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                UserId = userId,
                IsActive = isActive
            }
        );

        return rows > 0;
    }
    // =========================================================
    // DELETE USER - SOFT DELETE
    // =========================================================

    public async Task<bool> DeleteUserAsync(
    Guid userId)
    {
        using var connection = _context.CreateConnection();

        // Check whether the user exists
        const string userExistsSql = """
        SELECT EXISTS
        (
            SELECT 1
            FROM users
            WHERE user_id = @UserId
              AND is_deleted = FALSE
        );
        """;

        var userExists = await connection.ExecuteScalarAsync<bool>(
            userExistsSql,
            new
            {
                UserId = userId
            }
        );

        if (!userExists)
        {
            return false;
        }

        // Soft delete the user
        const string sql = """
        UPDATE users
        SET
            is_deleted = TRUE,
            deleted_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP,
            is_active = FALSE

        WHERE user_id = @UserId
          AND is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                UserId = userId
            }
        );

        return rows > 0;
    }

    // =========================================================
    // BORROWINGS
    // =========================================================

    public async Task<IEnumerable<AdminBorrowingResponse>> GetBorrowingsAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
    SELECT
        br.borrowing_id AS BorrowingId,

        u.user_id AS UserId,
        u.username AS Username,
        u.name AS Name,

        b.book_id AS BookId,
        b.title AS Title,
        b.author AS Author,

        br.start_date AS BorrowedDate,
        br.due_date AS DueDate,
        br.return_date AS ReturnedDate,

        COALESCE(br.fine, 0) AS Fine,

        CASE
            WHEN br.return_date IS NOT NULL
                THEN 'Returned'

            WHEN br.due_date < CURRENT_TIMESTAMP
                THEN 'Overdue'

            ELSE 'Borrowed'
        END AS Status

    FROM borrowings br

    INNER JOIN users u
        ON br.user_id = u.user_id

    INNER JOIN books b
        ON br.book_id = b.book_id

    WHERE u.is_deleted = FALSE
      AND b.is_deleted = FALSE

    ORDER BY br.start_date DESC;
    """;

        return await connection.QueryAsync<AdminBorrowingResponse>(
            sql
        );
    }

    // =========================================================
    // BORROW BOOK
    // =========================================================

    public async Task<Guid> BorrowBookAsync(
        BorrowBookRequest request)
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
                        request.UserId
                    },
                    transaction
                );

            if (userExists == 0)
            {
                throw new InvalidOperationException(
                    "User not found or inactive."
                );
            }

            const string bookSql = """
                SELECT
                    book_id AS BookId,
                    total_copies AS TotalCopies,
                    available_copies AS AvailableCopies
                FROM books
                WHERE book_id = @BookId
                  AND is_deleted = FALSE
                FOR UPDATE;
                """;

            var book =
                await connection.QuerySingleOrDefaultAsync<BookAvailability>(
                    bookSql,
                    new
                    {
                        request.BookId
                    },
                    transaction
                );

            if (book == null)
            {
                throw new InvalidOperationException(
                    "Book not found."
                );
            }

            if (book.AvailableCopies <= 0)
            {
                throw new InvalidOperationException(
                    "No copies available."
                );
            }

            const string insertSql = """
                INSERT INTO borrowings
                (
                    user_id,
                    book_id,
                    start_date,
                    due_date,
                    fine,
                    status
                )
                VALUES
                (
                    @UserId,
                    @BookId,
                    CURRENT_TIMESTAMP,
                    @DueDate,
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
                        request.UserId,
                        request.BookId,
                        request.DueDate
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
                        request.BookId
                    },
                    transaction
                );

            if (updatedRows == 0)
            {
                throw new InvalidOperationException(
                    "Book is no longer available."
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
    // RETURN BOOK
    // =========================================================

    public async Task<bool> ReturnBookAsync(
        Guid borrowingId)
    {
        using var connection = _context.CreateConnection();

        connection.Open();

        using var transaction = connection.BeginTransaction();

        try
        {
            const string borrowingSql = """
                SELECT
                    borrowing_id AS BorrowingId,
                    book_id AS BookId,
                    return_date AS ReturnDate

                FROM borrowings

                WHERE borrowing_id = @BorrowingId

                FOR UPDATE;
                """;

            var borrowing =
                await connection.QuerySingleOrDefaultAsync<BorrowingRecord>(
                    borrowingSql,
                    new
                    {
                        BorrowingId = borrowingId
                    },
                    transaction
                );

            if (borrowing == null)
            {
                transaction.Rollback();
                return false;
            }

            if (borrowing.ReturnDate != null)
            {
                transaction.Rollback();
                return false;
            }

            const string updateBorrowingSql = """
                UPDATE borrowings
                SET
                    return_date = CURRENT_TIMESTAMP,
                    status = 'Returned'

                WHERE borrowing_id = @BorrowingId
                  AND return_date IS NULL;
                """;

            var borrowingUpdated =
                await connection.ExecuteAsync(
                    updateBorrowingSql,
                    new
                    {
                        BorrowingId = borrowingId
                    },
                    transaction
                );

            if (borrowingUpdated == 0)
            {
                transaction.Rollback();
                return false;
            }

            const string updateBookSql = """
                UPDATE books
                SET
                    available_copies =
                        LEAST(
                            available_copies + 1,
                            total_copies
                        ),
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE book_id = @BookId;
                """;

            await connection.ExecuteAsync(
                updateBookSql,
                new
                {
                    borrowing.BookId
                },
                transaction
            );

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
    // ADD USER
    // =========================================================

    public async Task<Guid> AddUserAsync(
        AddUserRequest request)
    {
        using var connection =
            _context.CreateConnection();

        const string checkUsernameSql = """
            SELECT COUNT(*)
            FROM users
            WHERE username = @Username
              AND is_deleted = FALSE;
            """;

        var usernameExists =
            await connection.ExecuteScalarAsync<int>(
                checkUsernameSql,
                new
                {
                    request.Username
                }
            );

        if (usernameExists > 0)
        {
            throw new InvalidOperationException(
                "Username already exists."
            );
        }

        const string checkEmailSql = """
            SELECT COUNT(*)
            FROM users
            WHERE email = @Email
              AND is_deleted = FALSE;
            """;

        var emailExists =
            await connection.ExecuteScalarAsync<int>(
                checkEmailSql,
                new
                {
                    request.Email
                }
            );

        if (emailExists > 0)
        {
            throw new InvalidOperationException(
                "Email already exists."
            );
        }

        const string roleSql = """
            SELECT role_id
            FROM roles
            WHERE LOWER(role_name) =
                  LOWER(@Role)
            LIMIT 1;
            """;

        var roleId =
            await connection.ExecuteScalarAsync<Guid?>(
                roleSql,
                new
                {
                    request.Role
                }
            );

        if (!roleId.HasValue)
        {
            throw new InvalidOperationException(
                "Invalid role."
            );
        }

        var passwordHash =
            BCrypt.Net.BCrypt.HashPassword(
                request.Password
            );

        const string insertSql = """
            INSERT INTO users
            (
                username,
                name,
                email,
                phone,
                password_hash,
                role_id,
                is_active,
                is_deleted,
                created_at
            )
            VALUES
            (
                @Username,
                @Name,
                @Email,
                @Phone,
                @PasswordHash,
                @RoleId,
                TRUE,
                FALSE,
                CURRENT_TIMESTAMP
            )
            RETURNING user_id;
            """;

        return await connection.ExecuteScalarAsync<Guid>(
            insertSql,
            new
            {
                request.Username,
                request.Name,
                request.Email,
                request.Phone,
                PasswordHash = passwordHash,
                RoleId = roleId.Value
            }
        );
    }

    // =========================================================
    // RETURN NOTIFICATION
    // =========================================================

    public async Task<bool> CreateReturnNotificationAsync(
        Guid borrowingId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        INSERT INTO notifications
        (
            user_id,
            borrowing_id,
            recipient_user_id,
            notification_type,
            message,
            is_read,
            created_at
        )
        SELECT
            br.user_id,
            br.borrowing_id,
            br.user_id,

            'ReturnRequest',

            'Please return "' ||
                b.title ||
                '" as soon as possible.',

            FALSE,
            CURRENT_TIMESTAMP

        FROM borrowings br

        INNER JOIN books b
            ON br.book_id = b.book_id

        INNER JOIN users u
            ON br.user_id = u.user_id

        WHERE br.borrowing_id = @BorrowingId
          AND br.return_date IS NULL
          AND u.is_deleted = FALSE
          AND u.is_active = TRUE

          AND NOT EXISTS
          (
              SELECT 1
              FROM notifications n
              WHERE n.borrowing_id = br.borrowing_id
                AND n.recipient_user_id = br.user_id
                AND n.notification_type = 'ReturnRequest'
                AND n.is_read = FALSE
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

    public async Task<IEnumerable<AdminNotificationResponse>>
        GetNotificationsAsync()
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        SELECT
            n.notification_id AS NotificationId,
            n.borrowing_id AS BorrowingId,

            u.user_id AS UserId,
            u.username AS Username,
            u.name AS Name,

            b.book_id AS BookId,
            b.title AS Title,

            n.notification_type AS NotificationType,
            n.message AS Message,
            n.is_read AS IsRead,
            n.created_at AS CreatedAt

        FROM notifications n

        INNER JOIN users u
            ON n.user_id = u.user_id

        LEFT JOIN borrowings br
            ON n.borrowing_id = br.borrowing_id

        LEFT JOIN books b
            ON br.book_id = b.book_id

        INNER JOIN users admin
            ON n.recipient_user_id = admin.user_id

        INNER JOIN roles r
            ON admin.role_id = r.role_id

        WHERE
            admin.is_deleted = FALSE
            AND admin.is_active = TRUE
            AND LOWER(r.role_name) = 'admin'

        ORDER BY
            n.created_at DESC;
        """;

        return await connection.QueryAsync<AdminNotificationResponse>(
            sql
        );
    }

    public async Task<bool> MarkNotificationAsReadAsync(
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        UPDATE notifications n
        SET is_read = TRUE

        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.role_id

        WHERE n.notification_id = @NotificationId
          AND n.recipient_user_id = u.user_id
          AND LOWER(r.role_name) = 'admin'
          AND u.is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                NotificationId = notificationId
            }
        );

        return rows > 0;
    }

    public async Task<bool> MarkNotificationAsUnreadAsync(
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        UPDATE notifications n
        SET is_read = FALSE

        FROM users u
        INNER JOIN roles r
            ON u.role_id = r.role_id

        WHERE n.notification_id = @NotificationId
          AND n.recipient_user_id = u.user_id
          AND LOWER(r.role_name) = 'admin'
          AND u.is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                NotificationId = notificationId
            }
        );

        return rows > 0;
    }

    public async Task<bool> DeleteNotificationAsync(
        Guid notificationId)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        DELETE FROM notifications n

        USING users u, roles r

        WHERE n.notification_id = @NotificationId
          AND n.recipient_user_id = u.user_id
          AND u.role_id = r.role_id
          AND LOWER(r.role_name) = 'admin'
          AND u.is_deleted = FALSE;
        """;

        var rows = await connection.ExecuteAsync(
            sql,
            new
            {
                NotificationId = notificationId
            }
        );

        return rows > 0;
    }

    // =========================================================
    // ADMIN PAYMENTS
    // =========================================================

    public async Task<IEnumerable<PaymentDto>> GetAdminPaymentsAsync()
    {
        const string sql = @"
        SELECT
            p.payment_id AS PaymentId,
            p.user_id AS UserId,
            p.book_id AS BookId,

            u.username AS UserName,
            u.email AS Email,

            COALESCE(b.title, 'General / Fine Payment') AS BookTitle,

            p.amount AS Amount,
            p.payment_method AS PaymentMethod,
            p.payment_status AS PaymentStatus,
            p.transaction_reference AS TransactionReference,

            p.created_at AS CreatedAt,
            p.completed_at AS CompletedAt,

            CASE
                WHEN bp.purchase_id IS NOT NULL THEN 'Book'
                ELSE 'Fine'
            END AS PaymentPurpose

        FROM payments p

        INNER JOIN users u
            ON u.user_id = p.user_id

        LEFT JOIN books b
            ON b.book_id = p.book_id

        LEFT JOIN book_purchases bp
            ON bp.payment_id = p.payment_id

        ORDER BY p.created_at DESC;
        ";

        using var connection = _context.CreateConnection();

        return await connection.QueryAsync<PaymentDto>(sql);
    }

    // =========================================================
    // ADMIN WALLET
    // =========================================================

    public async Task<AdminWalletResponse?> GetAdminWalletAsync()
    {
        const string sql = """
        SELECT
            w.wallet_id AS WalletId,
            w.user_id AS UserId,
            w.balance AS Balance

        FROM wallets w

        INNER JOIN users u
            ON u.user_id = w.user_id

        INNER JOIN roles r
            ON r.role_id = u.role_id

        WHERE LOWER(r.role_name) = 'admin'
          AND u.is_active = TRUE
          AND u.is_deleted = FALSE

        LIMIT 1;
        """;

        using var connection = _context.CreateConnection();

        return await connection.QuerySingleOrDefaultAsync<AdminWalletResponse>(
            sql
        );
    }
    public async Task<bool> SendUserNotificationAsync(
    Guid userId,
    string message)
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
            u.user_id,
            NULL,
            'AdminMessage',
            @Message,
            FALSE,
            CURRENT_TIMESTAMP

        FROM users u

        WHERE u.user_id = @UserId
          AND u.is_active = TRUE
          AND u.is_deleted = FALSE

        RETURNING notification_id;
        """;

        var notificationId =
            await connection.QuerySingleOrDefaultAsync<Guid?>(
                sql,
                new
                {
                    UserId = userId,
                    Message = message
                }
            );

        return notificationId.HasValue;
    }
}