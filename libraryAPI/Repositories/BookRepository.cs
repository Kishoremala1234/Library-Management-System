using Dapper;
using LibraryAPI.Context;
using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public class BookRepository : IBookRepository
{
    private readonly DapperContext _context;

    public BookRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<BookResponse>> GetAllBooksAsync()
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
                COALESCE(NULLIF(b.price, 0), b.amount, 0) AS Price,
                COALESCE(NULLIF(b.amount, 0), ROUND(b.price)::int, 0) AS Amount

            FROM books b

            INNER JOIN categories c
                ON b.category_id = c.category_id

            WHERE b.is_deleted = FALSE
              AND c.is_deleted = FALSE

            ORDER BY b.title;
            """;

        return await connection.QueryAsync<BookResponse>(sql);
    }
    public async Task<IEnumerable<BookResponse>> GetMostReadBooksAsync(
    string category)
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

            COUNT(br.borrowing_id)::int AS TotalBorrowings

        FROM books b

        INNER JOIN categories c
            ON b.category_id = c.category_id

        LEFT JOIN borrowings br
            ON b.book_id = br.book_id

        WHERE b.is_deleted = FALSE
          AND c.is_deleted = FALSE
          AND LOWER(c.category_name) = LOWER(@Category)

        GROUP BY
            b.book_id,
            b.title,
            b.author,
            b.isbn,
            b.description,
            b.cover_image,
            b.publisher,
            b.published_year,
            c.category_id,
            c.category_name,
            b.total_copies,
            b.available_copies

        ORDER BY
            TotalBorrowings DESC,
            b.title ASC

        LIMIT 4;
        """;

        return await connection.QueryAsync<BookResponse>(
            sql,
            new
            {
                Category = category
            }
        );
    }
    public async Task<IEnumerable<HomeBookSearchResponse>> SearchBooksAsync(
    string query)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
        WITH active_borrowings AS
        (
            SELECT
                book_id,
                MIN(due_date) AS next_due_date
            FROM borrowings
            WHERE return_date IS NULL
            GROUP BY book_id
        )

        SELECT
            b.book_id AS BookId,
            b.title AS Title,
            b.author AS Author,
            b.cover_image AS CoverImage,

            COALESCE(
                c.category_name,
                'Uncategorized'
            ) AS CategoryName,

            b.available_copies AS AvailableCopies,

            CASE
                WHEN b.available_copies > 0
                    THEN 'Available'

                WHEN ab.next_due_date IS NOT NULL
                     AND ab.next_due_date <=
                         CURRENT_TIMESTAMP + INTERVAL '7 days'
                    THEN 'Soon Available'

                ELSE 'Not Available'
            END AS AvailabilityStatus

        FROM books b

        LEFT JOIN categories c
            ON b.category_id = c.category_id

        LEFT JOIN active_borrowings ab
            ON b.book_id = ab.book_id

        WHERE b.is_deleted = FALSE
          AND (
                b.title ILIKE '%' || @Query || '%'
                OR b.author ILIKE '%' || @Query || '%'
                OR b.isbn ILIKE '%' || @Query || '%'
                OR COALESCE(c.category_name, '')
                    ILIKE '%' || @Query || '%'
              )

        ORDER BY b.title;
        """;

        return await connection.QueryAsync<HomeBookSearchResponse>(
            sql,
            new
            {
                Query = query
            }
        );
    }
    public async Task<IEnumerable<CategoryResponse>> GetCategoriesAsync()
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

        return await connection.QueryAsync<CategoryResponse>(sql);
    }
}