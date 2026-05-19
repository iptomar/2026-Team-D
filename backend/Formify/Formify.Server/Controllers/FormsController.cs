using Formify.Server.DTOs;
using Formify.Server.Models;
using Formify.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
            // Garante que o formulário tem nome.
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                ModelState.AddModelError(nameof(request.Title), "O nome do formulário é obrigatório.");
            }

            // Garante que foi selecionado pelo menos um público-alvo.
            if (request.Audience == null || !request.Audience.Any())
            {
                ModelState.AddModelError(nameof(request.Audience), "É obrigatório selecionar pelo menos um público-alvo.");
            }

            // Garante que o formulário tem pelo menos um campo real.
            if (request.Fields == null || !request.Fields.Any(f => f.Type != "section"))
            {
                ModelState.AddModelError(nameof(request.Fields), "O formulário deve conter pelo menos um campo.");
            }

            // If any of our manual business checks failed, trigger the validation problem format
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
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

        // estatísticas simples (contagens)
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var total = allForms?.Count ?? 0;
            var published = allForms?.Count(f => !f.StatusDrafted) ?? 0;
            var drafted = allForms?.Count(f => f.StatusDrafted) ?? 0;

            return Ok(new
            {
                totalForms = total,
                publishedForms = published,
                draftedForms = drafted
            });
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
        [Authorize]
        public async Task<IActionResult> SubmitForm(int formId, [FromBody] Dictionary<string, object> answers)
        {
            try
            {
                // 1. Extrair o ID e o Cargo do Utilizador diretamente do TOKEN JWT de forma segura
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(userRoleClaim))
                {
                    return Unauthorized(new { message = "Utilizador não autenticado ou token inválido." });
                }

                int userId = int.Parse(userIdClaim);
                string userRole = userRoleClaim.ToLower();

                // 2. Procurar o formulário
                var allForms = await _jsonHandler.GetAllFormsAsync();
                var form = allForms.FirstOrDefault(f => f.Id == formId);

                if (form == null)
                {
                    return NotFound(new { message = $"Formulário com ID {formId} não encontrado." });
                }

                if (form.StatusDrafted)
                {
                    return BadRequest(new { message = "Não é possível submeter respostas para um formulário em modo rascunho." });
                }

                // 3. Validação de Permissões com base no cargo extraído do Token
                var allowedAudiences = form.Audience != null
                    ? form.Audience.Where(a => a != null).Select(a => a.ToLower()).ToList()
                    : new List<string>();

                if (!allowedAudiences.Contains(userRole) && !allowedAudiences.Contains("todos"))
                {
                    return StatusCode(403, new { message = "Acesso negado. O teu cargo não tem permissão para preencher este formulário." });
                }

                // 4. Criar a Submissão
                var submission = new Submission
                {
                    FormId = formId,
                    UserId = userId, // Seguro do token
                    Answers = answers ?? new Dictionary<string, object>(),
                    SubmittedAt = DateTime.Now
                };

                var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
                allSubmissions.Add(submission);
                await _jsonHandler.SaveSubmissionsAsync(allSubmissions);

                return Ok(new { message = "Formulário submetido com sucesso!", submissionId = submission.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno no servidor.", erroDetalhado = ex.Message });
            }
        }
    }
}



  