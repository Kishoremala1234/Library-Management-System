using LibraryAPI.Models;

namespace LibraryAPI.Services;

public interface IBookService
{
    Task<IEnumerable<BookResponse>> GetAllBooksAsync();

    Task<IEnumerable<BookResponse>> GetMostReadBooksAsync(
        string category
    );

    Task<IEnumerable<HomeBookSearchResponse>> SearchBooksAsync(
    string query);

    Task<IEnumerable<CategoryResponse>> GetCategoriesAsync();
}