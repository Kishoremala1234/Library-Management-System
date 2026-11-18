using LibraryAPI.Models;
using LibraryAPI.Repositories;

namespace LibraryAPI.Services;

public class BookService : IBookService
{
    private readonly IBookRepository _repository;

    public BookService(IBookRepository repository)
    {
        _repository = repository;
    }

    public async Task<IEnumerable<BookResponse>> GetAllBooksAsync()
    {
        return await _repository.GetAllBooksAsync();
    }

    public async Task<IEnumerable<BookResponse>> GetMostReadBooksAsync(
        string category)
    {
        return await _repository.GetMostReadBooksAsync(category);
    }

    public async Task<IEnumerable<HomeBookSearchResponse>> SearchBooksAsync(
        string query)
    {
        return await _repository.SearchBooksAsync(query);
    }

    public async Task<IEnumerable<CategoryResponse>> GetCategoriesAsync()
    {
        return await _repository.GetCategoriesAsync();
    }
}