namespace Formify.Server.Models
{
    public enum FormStatus
    {
        Draft,
        Published,
        Archived
    }

    public class Form
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public List<string> Audience { get; set; } = new();

        // Estado único do formulário: Draft (rascunho), Published (disponível
        // para preenchimento) ou Archived (retirado de circulação).
        // Substituiu os antigos flags StatusDrafted + Archived.
        public FormStatus Status { get; set; } = FormStatus.Draft;

        // Versão do conteúdo do formulário. Incrementa sempre que o formulário
        // é atualizado (PUT), para que submissões anteriores possam ser
        // identificadas como associadas a uma versão antiga.
        public int Version { get; set; } = 1;

        public List<Field> Fields { get; set; } = new List<Field>();

        public DateTime CreatedAt { get; set; }

        public DateTime UpdatedAt { get; set; }

        public string Category { get; set; } = "Geral";

        public int? ResponsibleUserId { get; set; } = 0;

        public bool RequiresApproval { get; set; }
    }
}
