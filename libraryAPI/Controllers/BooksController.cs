using LibraryAPI.Models;
using LibraryAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LibraryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly IBookService _service;

    public BooksController(IBookService service)
    {
        _service = service;
    }

    // =========================================================
    // GET ALL BOOKS
    // =========================================================

    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAllBooks()
    {
        var books = await _service.GetAllBooksAsync();

        return Ok(books);
    }
    // =========================================================
    // GET ALL CATEGORIES
    // =========================================================

    [AllowAnonymous]
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _service.GetCategoriesAsync();

        return Ok(categories);
    }

    // =========================================================
    // MOST READ BOOKS
    // =========================================================

    [AllowAnonymous]
    [HttpGet("most-read")]
    public async Task<IActionResult> GetMostReadBooks(
        [FromQuery] string category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return BadRequest(new
            {
                message = "Category is required."
            });
        }

        var books =
            await _service.GetMostReadBooksAsync(
                category.Trim()
            );

        return Ok(books);
    }

    // =========================================================
    // HOME PAGE SEARCH
    // =========================================================

    [AllowAnonymous]
    [HttpGet("search")]
    public async Task<IActionResult> SearchBooks(
        [FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(
                Array.Empty<HomeBookSearchResponse>()
            );
        }

        var books =
            await _service.SearchBooksAsync(
                query.Trim()
            );

        return Ok(books);
    }

    // =========================================================
    // BORROW BOOK (ALIAS)
    // =========================================================

    [Authorize]
    [HttpPost("borrow")]
    [HttpPost("{bookId:guid}/borrow")]
    public async Task<IActionResult> BorrowBook(
        [FromRoute] Guid? bookId = null,
        [FromQuery] Guid? queryBookId = null,
        [FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] UserBorrowBookRequest? request = null,
        [FromServices] IUserService userService = null!)
    {
        var userIdValue = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdValue, out var userId))
        {
            return Unauthorized();
        }

        var targetBookId = (request != null && request.BookId != Guid.Empty)
            ? request.BookId
            : (bookId.HasValue && bookId.Value != Guid.Empty
                ? bookId.Value
                : (queryBookId.HasValue && queryBookId.Value != Guid.Empty
                    ? queryBookId.Value
                    : Guid.Empty));

        if (targetBookId == Guid.Empty)
        {
            return BadRequest(new { message = "Book ID is required." });
        }

        try
        {
            var borrowingId = await userService.BorrowBookAsync(userId, targetBookId);
            return Ok(new { message = "Book borrowed successfully.", borrowingId });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
