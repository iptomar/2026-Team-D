namespace Formify.Server.Models
{
    public class Notification
    {
        public int Id { get; set; }

        // ID do utilizador destinatário da notificação
        public int UserId { get; set; }

        // ID da submissão/pedido associado (opcional)
        public string? RequestId { get; set; }

        public string Message { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

    }
}
