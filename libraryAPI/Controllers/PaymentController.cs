using System.Security.Claims;
using LibraryAPI.Models;
using LibraryAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LibraryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentController : ControllerBase
{
    private readonly IPaymentService _service;

    public PaymentController(
        IPaymentService service)
    {
        _service = service;
    }

    // =========================================================
    // GET WALLET
    // =========================================================

    [HttpGet("wallet")]
    public async Task<IActionResult> GetWallet()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            userIdValue,
            out var userId))
        {
            return Unauthorized();
        }

        var wallet =
            await _service.GetWalletAsync(userId);

        if (wallet == null)
        {
            return NotFound(new
            {
                message = "Wallet not found."
            });
        }

        return Ok(wallet);
    }

    // =========================================================
    // ADD MONEY
    // =========================================================

    [HttpPost("wallet/add")]
    public async Task<IActionResult> AddMoney(
        [FromBody] AddMoneyRequest request)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            userIdValue,
            out var userId))
        {
            return Unauthorized();
        }

        if (request == null ||
            request.Amount <= 0)
        {
            return BadRequest(new
            {
                message =
                    "Amount must be greater than zero."
            });
        }

        var validMethods =
            new[]
            {
                "UPI",
                "Card",
                "Net Banking"
            };

        if (!validMethods.Contains(
            request.PaymentMethod,
            StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message =
                    "Invalid payment method."
            });
        }

        var added =
            await _service.AddMoneyAsync(
                userId,
                request.Amount,
                request.PaymentMethod);

        if (!added)
        {
            return BadRequest(new
            {
                message =
                    "Unable to add money."
            });
        }

        return Ok(new
        {
            message =
                "Money added successfully."
        });
    }

    // =========================================================
    // WALLET TRANSACTIONS
    // =========================================================

    [HttpGet("wallet/transactions")]
    public async Task<IActionResult>
        GetWalletTransactions()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            userIdValue,
            out var userId))
        {
            return Unauthorized();
        }

        var transactions =
            await _service
                .GetWalletTransactionsAsync(
                    userId);

        return Ok(transactions);
    }

    // =========================================================
    // BUY BOOK
    // =========================================================

    [HttpPost("buy")]
    public async Task<IActionResult> BuyBook(
        [FromBody] BuyBookRequest request)
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            userIdValue,
            out var userId))
        {
            return Unauthorized();
        }

        if (request == null ||
            request.BookId == Guid.Empty)
        {
            return BadRequest(new
            {
                message =
                    "Book ID is required."
            });
        }

        var validMethods =
            new[]
            {
                "Wallet"
            };

        if (!validMethods.Contains(
            request.PaymentMethod,
            StringComparer.OrdinalIgnoreCase))
        {
            return BadRequest(new
            {
                message =
                    "Invalid payment method."
            });
        }

        try
        {
            var purchase =
                await _service.BuyBookAsync(
                    userId,
                    request.BookId,
                    request.PaymentMethod);

            return Ok(new
            {
                message =
                    "Book purchased successfully.",

                purchase
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

    // =========================================================
    // PURCHASED BOOKS
    // =========================================================

    [HttpGet("purchased-books")]
    public async Task<IActionResult>
        GetPurchasedBooks()
    {
        var userIdValue =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            userIdValue,
            out var userId))
        {
            return Unauthorized();
        }

        var books =
            await _service
                .GetPurchasedBooksAsync(userId);

        return Ok(books);
    }

    // =========================================================
    // ADMIN BALANCE
    // =========================================================

    [HttpGet("admin/balance")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult>
        GetAdminBalance()
    {
        var balance =
            await _service
                .GetAdminBalanceAsync();

        return Ok(new
        {
            balance
        });
    }
}