using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnlineExamAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddInstitutionFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByAdminId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstituteName",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_CreatedByAdminId",
                table: "Users",
                column: "CreatedByAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_CreatedByAdminId",
                table: "Users",
                column: "CreatedByAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_CreatedByAdminId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_CreatedByAdminId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "InstituteName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Users");
        }
    }
}
