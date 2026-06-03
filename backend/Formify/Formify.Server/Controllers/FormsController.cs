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

        private static FormStatus StatusFromRequest(bool isDraft) =>
            isDraft ? FormStatus.Draft : FormStatus.Published;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFormRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                ModelState.AddModelError(nameof(request.Title), "O nome do formulário é obrigatório.");

            if (request.Audience == null || !request.Audience.Any())
                ModelState.AddModelError(nameof(request.Audience), "É obrigatório selecionar pelo menos um público-alvo.");

            if (request.Fields == null || !request.Fields.Any(f => f.Type != "section"))
                ModelState.AddModelError(nameof(request.Fields), "O formulário deve conter pelo menos um campo.");

            if (!ModelState.IsValid)
                return ValidationProblem(ModelState);

            var allForms = await _jsonHandler.GetAllFormsAsync();

            var form = new Form
            {
                Id = allForms.Any() ? allForms.Max(f => f.Id) + 1 : 1,
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                Category = request.Category,
                Audience = request.Audience,
                Status = StatusFromRequest(request.StatusDraft),
                ResponsibleUserId = request.ResponsibleUserId, // MAPEADO AQUI
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Fields = request.Fields
            };

            allForms.Add(form);
            await _jsonHandler.SaveFormsAsync(allForms);

            return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllForms(
            [FromQuery] string? status = null,
            [FromQuery] bool includeArchived = false,
            [FromQuery] bool onlyArchived = false)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            if (allForms == null) return NotFound(new { message = "No forms were found" });

            IEnumerable<Form> result = allForms;

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (Enum.TryParse<FormStatus>(status, ignoreCase: true, out var s))
                    result = result.Where(f => f.Status == s);
                else
                    return BadRequest(new { message = $"Status inválido: '{status}'. Valores: draft, published, archived." });
            }
            else if (onlyArchived)
            {
                result = result.Where(f => f.Status == FormStatus.Archived);
            }
            else if (!includeArchived)
            {
                result = result.Where(f => f.Status != FormStatus.Archived);
            }

            return Ok(result.ToList());
        }

        [HttpGet("published")]
        public async Task<IActionResult> GetPublishedForms()
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            if (allForms == null) return Ok(new List<Form>());

            var publishedForms = allForms.Where(f => f.Status == FormStatus.Published).ToList();
            return Ok(publishedForms);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var allForms = await _jsonHandler.GetAllFormsAsync() ?? [];
            var published = allForms.Count(f => f.Status == FormStatus.Published);
            var drafted = allForms.Count(f => f.Status == FormStatus.Draft);
            var archived = allForms.Count(f => f.Status == FormStatus.Archived);
            var total = published + drafted;

            return Ok(new
            {
                totalForms = total,
                publishedForms = published,
                draftedForms = drafted,
                archivedForms = archived
            });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var form = allForms.FirstOrDefault(f => f.Id == id);

            if (form == null) return NotFound(new { message = $"Form with ID {id} not found." });

            return Ok(form);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var formToRemove = allForms.FirstOrDefault(f => f.Id == id);

            if (formToRemove == null) return NotFound(new { message = $"Formulário com ID {id} não encontrado." });

            allForms.Remove(formToRemove);
            await _jsonHandler.SaveFormsAsync(allForms);

            return Ok(new { message = "Formulário eliminado com sucesso." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateForm(int id, [FromBody] CreateFormRequest request)
        {
            if (!ModelState.IsValid) return ValidationProblem(ModelState);
            if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest(new { message = "O nome do formulário é obrigatório." });
            if (request.Audience == null || !request.Audience.Any()) return BadRequest(new { message = "É obrigatório selecionar pelo menos um público-alvo." });
            if (request.Fields == null || !request.Fields.Any(f => f.Type != "section")) return BadRequest(new { message = "O formulário deve conter pelo menos um campo." });

            var allForms = await _jsonHandler.GetAllFormsAsync();
            var formToUpdate = allForms.FirstOrDefault(f => f.Id == id);

            if (formToUpdate == null) return NotFound(new { message = $"Formulário com ID {id} não encontrado." });
            if (formToUpdate.Status == FormStatus.Archived) return StatusCode(403, new { message = "Não é possível editar um formulário arquivado. Reativa-o primeiro." });

            formToUpdate.Title = request.Title.Trim();
            formToUpdate.Description = request.Description?.Trim();
            formToUpdate.Category = request.Category;
            formToUpdate.Audience = request.Audience;
            formToUpdate.Status = StatusFromRequest(request.StatusDraft);
            formToUpdate.ResponsibleUserId = request.ResponsibleUserId; // MAPEADO AQUI
            formToUpdate.UpdatedAt = DateTime.Now;
            formToUpdate.Fields = request.Fields;
            formToUpdate.Version += 1;

            await _jsonHandler.SaveFormsAsync(allForms);

            return Ok(new { message = "Formulário atualizado com sucesso.", form = formToUpdate });
        }

        [HttpPost("{id}/duplicate")]
        public async Task<IActionResult> DuplicateForm(int id)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var original = allForms.FirstOrDefault(f => f.Id == id);

            if (original == null) return NotFound(new { message = $"Formulário com ID {id} não encontrado." });

            var copy = new Form
            {
                Id = allForms.Any() ? allForms.Max(f => f.Id) + 1 : 1,
                Title = $"Cópia de {original.Title}",
                Description = original.Description,
                Audience = [.. original.Audience],
                Status = FormStatus.Draft,
                Version = 1,
                ResponsibleUserId = original.ResponsibleUserId, // A CÓPIA TAMBÉM HERDA O RESPONSÁVEL
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Fields = original.Fields.Select(f => new Field
                {
                    Id = f.Id,
                    Type = f.Type,
                    Label = f.Label,
                    Required = f.Required,
                    Placeholder = f.Placeholder,
                    Order = f.Order,
                    Width = f.Width,
                    Options = f.Options != null ? [.. f.Options] : null,
                    TableFixedRows = f.TableFixedRows,
                    TableRowCount = f.TableRowCount
                }).ToList()
            };

            allForms.Add(copy);
            await _jsonHandler.SaveFormsAsync(allForms);

            return CreatedAtAction(nameof(GetById), new { id = copy.Id }, copy);
        }

        [HttpPatch("{id}/archive")]
        public async Task<IActionResult> ArchiveForm(int id) => await ChangeStatus(id, FormStatus.Archived, "Formulário arquivado.");

        [HttpPatch("{id}/unarchive")]
        public async Task<IActionResult> UnarchiveForm(int id) => await ChangeStatus(id, FormStatus.Draft, "Formulário recuperado para rascunho.");

        private async Task<IActionResult> ChangeStatus(int id, FormStatus status, string message)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var form = allForms.FirstOrDefault(f => f.Id == id);
            if (form == null) return NotFound(new { message = $"Formulário com ID {id} não encontrado." });

            form.Status = status;
            form.UpdatedAt = DateTime.Now;
            await _jsonHandler.SaveFormsAsync(allForms);
            return Ok(new { message, form });
        }

        [HttpPost("{formId}/submissions")]
        [Authorize]
        public async Task<IActionResult> SubmitForm(int formId, [FromBody] Dictionary<string, object> answers)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRoleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || string.IsNullOrEmpty(userRoleClaim)) return Unauthorized(new { message = "Utilizador não autenticado ou token inválido." });

                int userId = int.Parse(userIdClaim);
                string userRole = userRoleClaim.ToLower();

                var allForms = await _jsonHandler.GetAllFormsAsync();
                var form = allForms.FirstOrDefault(f => f.Id == formId);

                if (form == null) return NotFound(new { message = $"Formulário com ID {formId} não encontrado." });
                if (form.Status != FormStatus.Published) return BadRequest(new { message = form.Status == FormStatus.Archived ? "Este formulário foi arquivado e já não aceita novas submissões." : "Não é possível submeter respostas para um formulário em modo rascunho." });

                var allowedAudiences = form.Audience != null ? form.Audience.Where(a => a != null).Select(a => a.ToLower()).ToList() : new List<string>();
                if (!allowedAudiences.Contains(userRole) && !allowedAudiences.Contains("todos")) return StatusCode(403, new { message = "Acesso negado. O teu cargo não tem permissão para preencher este formulário." });

                var submission = new Submission
                {
                    FormId = formId,
                    UserId = userId,
                    Answers = answers ?? new Dictionary<string, object>(),
                    SubmittedAt = DateTime.Now,
                    FormVersion = form.Version
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