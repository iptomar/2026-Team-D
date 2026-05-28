namespace Formify.Server.Models
{
    public class Form
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public List<string> Audience { get; set; } = new();

        public bool StatusDrafted { get; set; }

        public List<Field> Fields { get; set; } = new List<Field>();

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }
    }
}