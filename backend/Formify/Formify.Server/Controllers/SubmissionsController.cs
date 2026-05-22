using Formify.Server.Models;
using Formify.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Formify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly JsonHandler _jsonHandler;

        public SubmissionsController(JsonHandler jsonHandler)
        {
            _jsonHandler = jsonHandler;
        }

        // GET /api/submissions/me
        // Lista as submissões do utilizador autenticado com informação básica
        // do formulário associado (título e descrição) para apresentação na UI.
        [HttpGet("me")]
        public async Task<IActionResult> GetMySubmissions()
        {
            if (!TryGetUserId(out int userId))
            {
                return Unauthorized(new { message = "Utilizador não autenticado ou token inválido." });
            }

            var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
            var allForms = await _jsonHandler.GetAllFormsAsync();

            var mySubmissions = allSubmissions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.SubmittedAt)
                .Select(s =>
                {
                    var form = allForms.FirstOrDefault(f => f.Id == s.FormId);
                    // "stale" = o formulário foi alterado depois desta submissão.
                    var isStale = form != null && form.Version > s.FormVersion;
                    var formArchived = form != null && form.Status == FormStatus.Archived;
                    return new
                    {
                        id = s.Id,
                        formId = s.FormId,
                        formTitle = form?.Title ?? "(Formulário removido)",
                        formDescription = form?.Description,
                        submittedAt = s.SubmittedAt,
                        status = "Submetido",
                        formVersion = s.FormVersion,
                        currentFormVersion = form?.Version,
                        isStale,
                        formArchived
                    };
                })
                .ToList();

            return Ok(mySubmissions);
        }

        // GET /api/submissions/me/{id}
        // Detalhe de uma submissão própria. Devolve a submissão completa e o
        // formulário associado para que a UI consiga mostrar perguntas + respostas.
        [HttpGet("me/{id}")]
        public async Task<IActionResult> GetMySubmissionDetail(string id)
        {
            if (!TryGetUserId(out int userId))
            {
                return Unauthorized(new { message = "Utilizador não autenticado ou token inválido." });
            }

            var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
            var submission = allSubmissions.FirstOrDefault(s => s.Id == id);

            if (submission == null)
            {
                return NotFound(new { message = "Submissão não encontrada." });
            }

            // Bloqueio explícito: o utilizador só pode aceder às suas próprias submissões.
            if (submission.UserId != userId)
            {
                return StatusCode(403, new { message = "Acesso negado a esta submissão." });
            }

            var allForms = await _jsonHandler.GetAllFormsAsync();
            var form = allForms.FirstOrDefault(f => f.Id == submission.FormId);

            var isStale = form != null && form.Version > submission.FormVersion;
            var formArchived = form != null && form.Status == FormStatus.Archived;

            return Ok(new
            {
                id = submission.Id,
                formId = submission.FormId,
                submittedAt = submission.SubmittedAt,
                status = "Submetido",
                answers = submission.Answers,
                form,
                formVersion = submission.FormVersion,
                currentFormVersion = form?.Version,
                isStale,
                formArchived
            });
        }

        private bool TryGetUserId(out int userId)
        {
            userId = 0;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return !string.IsNullOrEmpty(claim) && int.TryParse(claim, out userId);
        }
    }
}
