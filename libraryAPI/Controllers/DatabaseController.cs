using Dapper;
using LibraryAPI.Context;
using Microsoft.AspNetCore.Mvc;

namespace LibraryAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DatabaseController : ControllerBase
    {
        private readonly DapperContext _context;

        public DatabaseController(DapperContext context)
        {
            _context = context;
        }

        [HttpGet("test")]
        public async Task<IActionResult> TestConnection()
        {
            using var connection = _context.CreateConnection();

            var result = await connection.QuerySingleAsync<int>("SELECT 1");

            return Ok(new
            {
                message = "Database connection successful",
                result = result
            });
        }
    }
}