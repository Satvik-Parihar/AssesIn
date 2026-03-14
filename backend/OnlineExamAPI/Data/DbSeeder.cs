using Microsoft.EntityFrameworkCore;

namespace OnlineExamAPI.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        // Remove legacy demo/test seed users if they exist in older databases.
        var legacyUsers = await context.Users
            .Where(u => u.Email == "satvik@admin.com" || u.Email == "satvik@student.com")
            .ToListAsync();

        if (legacyUsers.Count > 0)
        {
            context.Users.RemoveRange(legacyUsers);
            await context.SaveChangesAsync();
        }
    }
}
