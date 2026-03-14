using Microsoft.EntityFrameworkCore;

namespace OnlineExamAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (context.Database.IsSqlite())
        {
            await context.Database.EnsureCreatedAsync();
            return;
        }

        await context.Database.MigrateAsync();
    }
}
