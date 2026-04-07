namespace Formify.Server.Models
{
    public class Form
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public bool StatusDrafted { get; set; }

        public List<string> Fields { get; set; } = new List<string>();

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}