namespace Formify.Server.DTOs
{
    public class SubmitFormRequest
    {
        public int UserId { get; set; }

        // Passamos o cargo (ex: "Funcionario" ou "Professor") para validar a permissão
        public string UserRole { get; set; } = string.Empty;

        public Dictionary<string, object> Answers { get; set; } = new();
    }
}