namespace LibraryAPI.Services;

public interface IJwtTokenService
{
    string CreateToken(
        Guid userId,
        string username,
        string role);
}