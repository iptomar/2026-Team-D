using Formify.Server.DTOs;
using Formify.Server.Models;
using Formify.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Formify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FormsController : ControllerBase
    {
        private readonly JsonHandler _jsonHandler;

        public FormsController(JsonHandler jsonHandler)
        {
            _jsonHandler = jsonHandler;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFormRequest request)
        {
            // Validação automática das anotações existentes no DTO.
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            // Garante que o formulário tem nome.
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "O nome do formulário é obrigatório." });
            }

            // Garante que foi selecionado pelo menos um público-alvo.
            if (request.Audience == null || !request.Audience.Any())
            {
                return BadRequest(new { message = "É obrigatório selecionar pelo menos um público-alvo." });
            }

            // Garante que o formulário tem pelo menos um campo real.
            // O tipo "section" serve apenas como separador visual e não conta como campo de resposta.
            if (request.Fields == null || !request.Fields.Any(f => f.Type != "section"))
            {
                return BadRequest(new { message = "O formulário deve conter pelo menos um campo." });
            }

            // Carrega os formulários existentes para gerar o próximo ID e acrescentar o novo formulário.
            var allForms = await _jsonHandler.GetAllFormsAsync();

            var form = new Form
            {
                Id = allForms.Any() ? allForms.Max(f => f.Id) + 1 : 1,
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                Audience = request.Audience,
                StatusDrafted = request.StatusDraft,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Fields = request.Fields
            };

            allForms.Add(form);
            await _jsonHandler.SaveFormsAsync(allForms);

            return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllForms()
        {
            // Carrega a lista completa de formulários guardados no ficheiro JSON.
            var allForms = await _jsonHandler.GetAllFormsAsync();

            if (allForms == null)
            {
                return NotFound(new { message = "No forms were found" });
            }

            return Ok(allForms);
        }

        [HttpGet("published")]
        public async Task<IActionResult> GetPublishedForms()
        {
            // 1. Vai buscar todos os formulários ao ficheiro JSON
            var allForms = await _jsonHandler.GetAllFormsAsync();

            if (allForms == null)
            {
                return Ok(new List<Form>());
            }

            // 2. Filtra apenas os que estão publicados
            var publishedForms = allForms.Where(f => !f.StatusDrafted).ToList();

            // 3. Devolve a lista filtrada
            return Ok(publishedForms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            // Carrega a lista completa de formulários guardados no ficheiro JSON.
            var allForms = await _jsonHandler.GetAllFormsAsync();

            // Procura o formulário correspondente ao ID recebido.
            var form = allForms.FirstOrDefault(f => f.Id == id);

            // Se não existir, devolve 404.
            if (form == null)
            {
                return NotFound(new { message = $"Form with ID {id} not found." });
            }

            return Ok(form);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            // Carrega os formulários existentes.
            var allForms = await _jsonHandler.GetAllFormsAsync();

            // Procura o formulário a remover.
            var formToRemove = allForms.FirstOrDefault(f => f.Id == id);

            if (formToRemove == null)
            {
                return NotFound(new { message = $"Formulário com ID {id} não encontrado." });
            }

            allForms.Remove(formToRemove);
            await _jsonHandler.SaveFormsAsync(allForms);

            return Ok(new { message = "Formulário eliminado com sucesso." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateForm(int id, [FromBody] CreateFormRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "O nome do formulário é obrigatório." });
            }

            if (request.Audience == null || !request.Audience.Any())
            {
                return BadRequest(new { message = "É obrigatório selecionar pelo menos um público-alvo." });
            }

            if (request.Fields == null || !request.Fields.Any(f => f.Type != "section"))
            {
                return BadRequest(new { message = "O formulário deve conter pelo menos um campo." });
            }

            // Carrega todos os formulários e procura o que tem o ID correspondente
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var formToUpdate = allForms.FirstOrDefault(f => f.Id == id);

            if (formToUpdate == null)
            {
                return NotFound(new { message = $"Formulário com ID {id} não encontrado." });
            }

            // Um formulário publicado não pode ser editado.
            // A única transição permitida sobre um publicado é voltar a rascunho (StatusDraft = true).
            if (!formToUpdate.StatusDrafted && !request.StatusDraft)
            {
                return StatusCode(403, new
                {
                    message = "Não é possível editar um formulário publicado. Mova-o primeiro para rascunho."
                });
            }

            // Atualiza os dados do formulário existente
            formToUpdate.Title = request.Title.Trim();
            formToUpdate.Description = request.Description?.Trim();
            formToUpdate.Audience = request.Audience;
            formToUpdate.StatusDrafted = request.StatusDraft;
            formToUpdate.UpdatedAt = DateTime.Now;
            formToUpdate.Fields = request.Fields;

            // Guarda as alterações
            await _jsonHandler.SaveFormsAsync(allForms);

            return Ok(new { message = "Formulário atualizado com sucesso.", form = formToUpdate });
        }


        // Adiciona este método dentro da classe FormsController
        [HttpPost("{formId}/submissions")]
        public async Task<IActionResult> SubmitForm(int formId, [FromBody] SubmitFormRequest request)
        {
            // 1. Procurar o formulário
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var form = allForms.FirstOrDefault(f => f.Id == formId);

            // Validação A: O formulário existe?
            if (form == null)
            {
                return NotFound(new { message = $"Formulário com ID {formId} não encontrado." });
            }

            // Validação B: O formulário está publicado?
            if (form.StatusDrafted)
            {
                return BadRequest(new { message = "Não é possível submeter respostas para um formulário que está em modo rascunho." });
            }

            // Validação C: O utilizador tem permissão (Audience) para preencher?
            // Convertemos tudo para minúsculas para evitar erros como "Funcionario" vs "funcionario"
            var allowedAudiences = form.Audience.Select(a => a.ToLower()).ToList();
            var userRole = request.UserRole.ToLower();

            if (!allowedAudiences.Contains(userRole) && !allowedAudiences.Contains("todos"))
            {
                return StatusCode(403, new { message = "Acesso negado. O teu cargo não tem permissão para preencher este formulário." });
            }

            // 2. Criar o objeto da Submissão
            var submission = new Submission
            {
                FormId = formId,
                UserId = request.UserId,
                Answers = request.Answers,
                SubmittedAt = DateTime.Now
            };

            // 3. Guardar no ficheiro JSON das submissões
            var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
            allSubmissions.Add(submission);
            await _jsonHandler.SaveSubmissionsAsync(allSubmissions);

            return Ok(new
            {
                message = "Formulário submetido com sucesso!",
                submissionId = submission.Id
            });
        }
    }
}