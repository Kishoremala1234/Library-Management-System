using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using LibraryAPI.Models;
using LibraryAPI.Services;

namespace LibraryAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(
        IAuthService service,
        IJwtTokenService jwtTokenService)
    {
        _service = service;
        _jwtTokenService = jwtTokenService;
    }


    // =========================
    // SIGNUP
    // =========================

    [HttpPost("signup")]
    public async Task<IActionResult> Signup(
        SignupRequest request)
    {
        var result =
            await _service.SignupAsync(request);

        if (!result.Success)
        {
            if (result.Message ==
                "Username already exists.")
            {
                return Conflict(new
                {
                    message = result.Message
                });
            }

            if (result.Message ==
                "Email already exists.")
            {
                return Conflict(new
                {
                    message = result.Message
                });
            }

            return BadRequest(new
            {
                message = result.Message
            });
        }

        return Ok(new
        {
            message = result.Message,
            userId = result.UserId,
            token = result.Token,
            username = result.Username,
            role = result.Role
        });
    }


    // =========================
    // CHECK EMAIL
    // =========================

    [HttpGet("check-email")]
    public async Task<IActionResult> CheckEmail(
        [FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return Ok(new
            {
                exists = false
            });
        }

        var exists =
            await _service.EmailExistsAsync(
                email.Trim()
            );

        return Ok(new
        {
            exists
        });
    }


    // =========================
    // CHECK USERNAME
    // =========================

    [HttpGet("check-username")]
    public async Task<IActionResult> CheckUsername(
        [FromQuery] string username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return Ok(new
            {
                exists = false
            });
        }

        var exists =
            await _service.UsernameExistsAsync(
                username.Trim()
            );

        return Ok(new
        {
            exists
        });
    }


    // =========================
    // LOGIN
    // =========================

    [HttpPost("login")]
    public async Task<IActionResult> Login(
        LoginRequest request)
    {
        try
        {
            var result =
                await _service.LoginAsync(request);

            if (result == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid username/email or password."
                });
            }


            // =========================
            // CHECK ACCOUNT STATUS
            // =========================

            if (result.IsDeleted ||
                !result.IsActive)
            {
                var hasRecentRequest =
                    await _service.HasRecentAdminRequestAsync(
                        request.Username?.Trim()
                        ?? string.Empty
                    );

                if (hasRecentRequest)
                {
                    return StatusCode(403, new
                    {
                        message =
                            "Your request is being validated by the admin. Please try again later."
                    });
                }

                return StatusCode(403, new
                {
                    message =
                        "This account has been deactivated/Deleted. Please contact the admin."
                });
            }


            // =========================
            // CHECK PASSWORD
            // =========================

            if (!result.PasswordValid)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid username/email or password."
                });
            }


            // =========================
            // CREATE JWT
            // =========================

            var token =
                _jwtTokenService.CreateToken(
                    result.UserId,
                    result.Username,
                    result.Role
                );


            // =========================
            // LOGIN SUCCESS
            // =========================

            return Ok(new
            {
                token,
                userId = result.UserId,
                username = result.Username,
                name = result.Name,
                email = result.Email,
                role = result.Role
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                "========== LOGIN ERROR =========="
            );

            Console.WriteLine(ex.ToString());

            Console.WriteLine(
                "================================="
            );

            return StatusCode(500, new
            {
                message = ex.Message,
                detail =
                    ex.InnerException?.Message
            });
        }
    }


    // =========================
    // CURRENT USER
    // =========================

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            userId =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier
                ),

            username =
                User.FindFirstValue(
                    ClaimTypes.Name
                ),

            role =
                User.FindFirstValue(
                    ClaimTypes.Role
                )
        });
    }


    // =========================
    // REQUEST ADMIN
    // =========================

    [HttpPost("request-admin")]
    public async Task<IActionResult> RequestAdmin(
        [FromBody] AdminRequestNotification request)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.UsernameOrEmail))
            {
                return BadRequest(new
                {
                    message = "Username or email is required."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new
                {
                    message = "Message is required."
                });
            }

            var success =
                await _service.RequestAdminAsync(
                    request.UsernameOrEmail.Trim(),
                    request.Message.Trim()
                );

            if (!success)
            {
                return BadRequest(new
                {
                    message =
                        "Unable to send the request. User or active admin not found."
                });
            }

            return Ok(new
            {
                message =
                    "Your request has been sent to the admin successfully."
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                "========== REQUEST ADMIN ERROR =========="
            );

            Console.WriteLine(ex.ToString());

            Console.WriteLine(
                "========================================="
            );

            return StatusCode(500, new
            {
                message =
                    "An error occurred while sending the request.",

                detail =
                    ex.Message,

                innerDetail =
                    ex.InnerException?.Message
            });
        }
    }
    // =========================
    // CHANGE PASSWORD
    // =========================

    [Authorize]
    [HttpPut("change-password")]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
        {
            return BadRequest(new
            {
                message = "Current password is required."
            });
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new
            {
                message = "New password is required."
            });
        }

        var userIdClaim =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

        if (!Guid.TryParse(
                userIdClaim,
                out var userId))
        {
            return Unauthorized(new
            {
                message = "Invalid user authentication."
            });
        }

        var result =
            await _service.ChangePasswordAsync(
                userId,
                request.CurrentPassword,
                request.NewPassword
            );

        if (!result.Success)
        {
            return BadRequest(new
            {
                message = result.Message
            });
        }

        return Ok(new
        {
            message = result.Message
        });
    }
}
