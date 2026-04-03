using System.ComponentModel.DataAnnotations;

namespace Formify.Server.DTOs
{
    public class CreateFormRequest
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [MaxLength(200, ErrorMessage = "O nome não pode ter mais de 200 caracteres.")]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000, ErrorMessage = "A descrição não pode ter mais de 1000 caracteres.")]
        public string? Description { get; set; }
    }
}