using Dapper;
using LibraryAPI.Context;
using LibraryAPI.Models;

namespace LibraryAPI.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly DapperContext _context;

    public AuthRepository(DapperContext context)
    {
        _context = context;
    }


    // =========================
    // CHECK USERNAME
    // =========================

    public async Task<bool> UsernameExistsAsync(string username)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM users
                WHERE LOWER(username) = LOWER(@Username)
                  AND COALESCE(is_deleted, FALSE) = FALSE
            );
            """;

        return await connection.ExecuteScalarAsync<bool>(
            sql,
            new
            {
                Username = username
            }
        );
    }


    // =========================
    // CHECK EMAIL
    // =========================

    public async Task<bool> EmailExistsAsync(string email)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM users
                WHERE LOWER(email) = LOWER(@Email)
                  AND COALESCE(is_deleted, FALSE) = FALSE
            );
            """;

        return await connection.ExecuteScalarAsync<bool>(
            sql,
            new
            {
                Email = email
            }
        );
    }


    // =========================
    // SIGNUP
    // =========================

    // =========================
    // SIGNUP
    // =========================

    // =========================
    // SIGNUP
    // =========================

    public async Task<Guid> SignupAsync(SignupRequest request)
    {
        using var connection = _context.CreateConnection();

        if (connection.State != System.Data.ConnectionState.Open)
        {
            connection.Open();
        }

        const string insertUserSql = """
        INSERT INTO users
        (
            username,
            name,
            email,
            phone,
            password_hash,
            role_id
        )
        VALUES
        (
            @Username,
            @Name,
            @Email,
            @Phone,
            crypt(@Password, gen_salt('bf')),
            (
                SELECT role_id
                FROM roles
                WHERE LOWER(role_name) = LOWER('User')
                LIMIT 1
            )
        )
        RETURNING user_id;
        """;

        using var transaction =
            connection.BeginTransaction();

        try
        {
            var userId =
                await connection.ExecuteScalarAsync<Guid>(
                    insertUserSql,
                    new
                    {
                        request.Username,
                        request.Name,
                        request.Email,
                        request.Phone,
                        request.Password
                    },
                    transaction
                );

            transaction.Commit();

            return userId;
        }
        catch (Exception ex)
        {
            transaction.Rollback();

            Console.WriteLine(
                "========== SIGNUP DATABASE ERROR =========="
            );

            Console.WriteLine(ex.ToString());

            Console.WriteLine(
                "==========================================="
            );

            throw;
        }
    }


    // =========================
    // LOGIN
    // =========================

    public async Task<AuthResponse?> LoginAsync(
        LoginRequest request)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT
                u.user_id AS UserId,
                u.username AS Username,
                u.name AS Name,
                u.email AS Email,
                r.role_name AS Role,
                COALESCE(u.is_active, TRUE) AS IsActive,
                COALESCE(u.is_deleted, FALSE) AS IsDeleted,
                u.password_hash AS PasswordHash
            FROM users u
            INNER JOIN roles r
                ON u.role_id = r.role_id
            WHERE
                LOWER(u.username) =
                    LOWER(TRIM(@Username))
                OR
                LOWER(u.email) =
                    LOWER(TRIM(@Username))
            ORDER BY
                u.is_deleted ASC,
                u.user_id
            LIMIT 1;
            """;

        var user =
            await connection.QueryFirstOrDefaultAsync<AuthUserDb>(
                sql,
                new
                {
                    Username =
                        request.Username?.Trim()
                        ?? string.Empty
                }
            );

        if (user == null)
        {
            return null;
        }


        // =========================
        // CHECK RECENT ADMIN REQUEST
        // =========================

        var hasRecentAdminRequest =
            await HasRecentAdminRequestAsync(
                user.Username
            );


        // =========================
        // CHECK ACCOUNT STATUS
        // =========================

        if (user.IsDeleted || !user.IsActive)
        {
            return new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                IsActive = false,
                IsDeleted = user.IsDeleted,
                PasswordValid = true,
                HasRecentAdminRequest =
                    hasRecentAdminRequest
            };
        }


        // =========================
        // CHECK PASSWORD HASH
        // =========================

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            return new AuthResponse
            {
                UserId = user.UserId,
                Username = user.Username,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                IsActive = true,
                IsDeleted = false,
                PasswordValid = false,
                HasRecentAdminRequest =
                    hasRecentAdminRequest
            };
        }


        // =========================
        // VERIFY PASSWORD
        // =========================

        const string passwordSql = """
            SELECT COALESCE(
                password_hash =
                    crypt(
                        @Password,
                        password_hash
                    ),
                FALSE
            )
            FROM users
            WHERE user_id = @UserId;
            """;

        var passwordValid =
            await connection.ExecuteScalarAsync<bool>(
                passwordSql,
                new
                {
                    Password = request.Password,
                    UserId = user.UserId
                }
            );


        // =========================
        // RETURN LOGIN RESULT
        // =========================

        return new AuthResponse
        {
            UserId = user.UserId,
            Username = user.Username,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            IsActive = true,
            IsDeleted = false,
            PasswordValid = passwordValid,
            HasRecentAdminRequest =
                hasRecentAdminRequest
        };
    }


    // =========================
    // REQUEST ADMIN
    // =========================

    public async Task<bool> RequestAdminAsync(
        string usernameOrEmail,
        string message)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            INSERT INTO notifications
            (
                notification_id,
                user_id,
                borrowing_id,
                notification_type,
                message,
                is_read,
                created_at,
                recipient_user_id
            )
            SELECT
                gen_random_uuid(),
                u.user_id,
                NULL,
                'AdminRequest',
                @Message,
                FALSE,
                NOW(),
                admin.user_id
            FROM users u

            CROSS JOIN LATERAL
            (
                SELECT
                    admin_user.user_id
                FROM users admin_user

                INNER JOIN roles admin_role
                    ON admin_user.role_id =
                       admin_role.role_id

                WHERE LOWER(admin_role.role_name) =
                      LOWER('Admin')

                  AND COALESCE(
                      admin_user.is_deleted,
                      FALSE
                  ) = FALSE

                  AND COALESCE(
                      admin_user.is_active,
                      TRUE
                  ) = TRUE

                ORDER BY admin_user.user_id

                LIMIT 1
            ) admin

            WHERE
                (
                    LOWER(u.username) =
                    LOWER(TRIM(@UsernameOrEmail))

                    OR

                    LOWER(u.email) =
                    LOWER(TRIM(@UsernameOrEmail))
                )

                AND
                (
                    COALESCE(
                        u.is_deleted,
                        FALSE
                    ) = TRUE

                    OR

                    COALESCE(
                        u.is_active,
                        TRUE
                    ) = FALSE
                );
            """;

        var rowsAffected =
            await connection.ExecuteAsync(
                sql,
                new
                {
                    UsernameOrEmail =
                        usernameOrEmail,

                    Message =
                        message
                }
            );

        return rowsAffected > 0;
    }


    // =========================
    // CHECK RECENT ADMIN REQUEST
    // =========================

    public async Task<bool> HasRecentAdminRequestAsync(
        string usernameOrEmail)
    {
        using var connection = _context.CreateConnection();

        const string sql = """
            SELECT EXISTS (
                SELECT 1
                FROM notifications n
                INNER JOIN users u
                    ON n.user_id = u.user_id
                WHERE
                    (
                        LOWER(u.username) =
                        LOWER(TRIM(@UsernameOrEmail))

                        OR

                        LOWER(u.email) =
                        LOWER(TRIM(@UsernameOrEmail))
                    )

                    AND n.notification_type =
                        'AdminRequest'

                    AND n.created_at >=
                        NOW() - INTERVAL '5 minutes'
            );
            """;

        return await connection.ExecuteScalarAsync<bool>(
            sql,
            new
            {
                UsernameOrEmail =
                    usernameOrEmail
            }
        );
    }
    // =========================
    // CHANGE PASSWORD
    // =========================

    public async Task<(bool Success, string Message)> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword)
    {
        using var connection = _context.CreateConnection();

        // Verify current password first
        const string verifySql = """
        SELECT COALESCE(
            password_hash =
                crypt(
                    @CurrentPassword,
                    password_hash
                ),
            FALSE
        )
        FROM users
        WHERE user_id = @UserId
          AND COALESCE(is_deleted, FALSE) = FALSE
          AND COALESCE(is_active, TRUE) = TRUE;
        """;

        var currentPasswordValid =
            await connection.ExecuteScalarAsync<bool?>(
                verifySql,
                new
                {
                    UserId = userId,
                    CurrentPassword = currentPassword
                }
            );

        if (currentPasswordValid != true)
        {
            return (
                false,
                "Current password is incorrect."
            );
        }

        // Update password using the same bcrypt
        // mechanism used during signup.
        const string updateSql = """
        UPDATE users
        SET
            password_hash =
                crypt(
                    @NewPassword,
                    gen_salt('bf')
                ),
            updated_at = NOW()
        WHERE user_id = @UserId
          AND COALESCE(is_deleted, FALSE) = FALSE
          AND COALESCE(is_active, TRUE) = TRUE;
        """;

        var rowsAffected =
            await connection.ExecuteAsync(
                updateSql,
                new
                {
                    UserId = userId,
                    NewPassword = newPassword
                }
            );

        if (rowsAffected == 0)
        {
            return (
                false,
                "Unable to change password."
            );
        }

        return (
            true,
            "Password changed successfully."
        );
    }
}


// =========================================================
// DATABASE USER MODEL
// =========================================================

public class AuthUserDb
{
    public Guid UserId { get; set; }

    public string Username { get; set; } =
        string.Empty;

    public string Name { get; set; } =
        string.Empty;

    public string Email { get; set; } =
        string.Empty;

    public string Role { get; set; } =
        string.Empty;

    public bool IsActive { get; set; }

    public bool IsDeleted { get; set; }

    public string? PasswordHash { get; set; }
}