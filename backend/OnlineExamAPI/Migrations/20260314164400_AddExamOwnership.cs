using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExamOwnership : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByAdminId",
                table: "ExamPapers",
                type: "int",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ep
                SET ep.CreatedByAdminId = adminUser.Id
                FROM ExamPapers ep
                CROSS JOIN (
                    SELECT TOP(1) Id
                    FROM Users
                    WHERE Role = 'Admin'
                    ORDER BY Id
                ) adminUser
                WHERE ep.CreatedByAdminId IS NULL;
            ");

            migrationBuilder.AlterColumn<int>(
                name: "CreatedByAdminId",
                table: "ExamPapers",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExamPapers_CreatedByAdminId",
                table: "ExamPapers",
                column: "CreatedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExamPapers_Users_CreatedByAdminId",
                table: "ExamPapers",
                column: "CreatedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExamPapers_Users_CreatedByAdminId",
                table: "ExamPapers");

            migrationBuilder.DropIndex(
                name: "IX_ExamPapers_CreatedByAdminId",
                table: "ExamPapers");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "ExamPapers");
        }
    }
}
