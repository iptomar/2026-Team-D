namespace Formify.Server.Models
{
    public class Form
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Draft";

        public string SchemaJson { get; set; } = "{}";

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}