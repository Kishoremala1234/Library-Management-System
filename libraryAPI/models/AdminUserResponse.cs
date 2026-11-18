public class AdminUserResponse
{
    public Guid UserId { get; set; }

    public string Username { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? Phone { get; set; }

    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public int NotReturned { get; set; }

    public int OverdueBooks { get; set; }

    public decimal OutstandingFine { get; set; }

    public string BorrowingStatus { get; set; } = "No Due";
}