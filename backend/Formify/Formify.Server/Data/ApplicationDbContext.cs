using Formify.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Formify.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Form> Forms { get; set; }
    }
}