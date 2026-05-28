namespace Formify.Server.Models
{
    public class Submission
    {
        public string Id { get; set; } = Guid.NewGuid().ToString(); // ID único da submissão

        public int FormId { get; set; }

        public int UserId { get; set; } // ID do utilizador que preencheu

        // Dicionário para guardar as respostas: Key = ID ou Nome do Campo, Value = Resposta
        public Dictionary<string, object> Answers { get; set; } = new();

        public DateTime SubmittedAt { get; set; } = DateTime.Now;

        // Versão do formulário no momento da submissão. Permite detetar se o
        // formulário foi alterado depois da submissão (submissão desatualizada).
        public int FormVersion { get; set; } = 1;

        public string Status { get; set; } = "Pending";
    }
}