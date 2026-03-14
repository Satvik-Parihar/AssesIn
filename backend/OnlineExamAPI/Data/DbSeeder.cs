using Microsoft.EntityFrameworkCore;

namespace OnlineExamAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();
    }
}
