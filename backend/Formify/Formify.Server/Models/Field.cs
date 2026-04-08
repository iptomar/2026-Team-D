namespace Formify.Server.Models
{
    public class Field
    {
        public string Id { get; set; } = string.Empty;
        public string Type { get; set; } = "text";
        public string Label { get; set; } = string.Empty;
        public bool Required { get; set; } = false;
        public string? Placeholder { get; set; }
        public List<string>? Options { get; set; }
    }
}
