using Formify.Server.Models;
using Formify.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Formify.Server.DTOs;

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

        // GET /api/submissions/admin
        // Lista das submissões de todos os utilizadores
        [HttpGet("admin")]
        public async Task<IActionResult> GetAllSubmissions()
        {
            // Optional: You might want to check if the user is actually an Admin here
            if (!TryGetUserId(out int _))
            {
                return Unauthorized(new { message = "Utilizador não autenticado ou token inválido." });
            }

            var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
            var allForms = await _jsonHandler.GetAllFormsAsync();

            var result = allSubmissions
                .Where(s => s.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(s => s.SubmittedAt)
                .Select(s =>
                {
                    var form = allForms.FirstOrDefault(f => f.Id == s.FormId);

                    return new
                    {
                        id = s.Id,
                        userId = s.UserId, // Added this so you know WHO submitted it
                        formId = s.FormId,
                        formTitle = form?.Title ?? "(Formulário removido)",
                        formDescription = form?.Description,
                        submittedAt = s.SubmittedAt,
                        formVersion = s.FormVersion,
                        currentFormVersion = form?.Version,
                        isStale = form != null && form.Version > s.FormVersion,
                        formArchived = form != null && form.Status == FormStatus.Archived,
                        status = s.Status ?? "Pending"
                    };
                })
                .ToList();

            return Ok(result);
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
                       // status = "Submetido",
                        formVersion = s.FormVersion,
                        currentFormVersion = form?.Version,
                        isStale,
                        formArchived,
                        status = s.Status ?? "Pending"
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

            //check if user is an administrator
            bool isAdmin = User.IsInRole("admin");

            // Bloqueio explícito: o utilizador só pode aceder às suas próprias submissões.
            if (submission.UserId != userId && !isAdmin)
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
                status = submission.Status ?? "Pending",
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

        // PUT /api/submissions/{id}/status
        [HttpPut("status/{id}")]
        [Authorize(Roles="admin")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateStatusRequest request)
        {
            var validStatuses = new[] { "Pending", "Approved", "Refused" };
            if (!validStatuses.Contains(request.Status))
                return BadRequest(new { message = "Estado inválido." });

            var allSubmissions = await _jsonHandler.GetAllSubmissionsAsync();
            var submission = allSubmissions.FirstOrDefault(s => s.Id == id);

            if (submission == null)
                return NotFound(new { message = "Submissão não encontrada." });

            submission.Status = request.Status;
            await _jsonHandler.SaveSubmissionsAsync(allSubmissions);

            return Ok(new { message = "Estado atualizado.", status = submission.Status });
        }



    }
}
