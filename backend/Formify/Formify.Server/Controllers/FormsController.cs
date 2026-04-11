using Formify.Server.Data;
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
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "O nome do formulário é obrigatório." });
            }

            var allForms = await _jsonHandler.GetAllFormsAsync();

            var form = new Form
            {
                Id = allForms.Any() ? allForms.Max(f => f.Id) + 1 : 1,
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
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
            // 1. Load the entire list from the JSON file
            var allForms = await _jsonHandler.GetAllFormsAsync();

            if (allForms == null)
            {
                return NotFound(new { message = $"No forms were found" });
            }

            return Ok(allForms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            // 1. Load the entire list from the JSON file
            var allForms = await _jsonHandler.GetAllFormsAsync();

            // 2. Use LINQ to find the first form that matches the ID
            var form = allForms.FirstOrDefault(f => f.Id == id);

            // 3. Standard null check
            if (form == null)
            {
                return NotFound(new { message = $"Form with ID {id} not found." });
            }

            return Ok(form);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteForm(int id)
        {
            var allForms = await _jsonHandler.GetAllFormsAsync();
            var formToRemove = allForms.FirstOrDefault(f => f.Id == id);

            if (formToRemove == null)
            {
                return NotFound(new { message = $"Formulário com ID {id} não encontrado." });
            }

            allForms.Remove(formToRemove);
            await _jsonHandler.SaveFormsAsync(allForms);

            return Ok(new { message = "Formulário eliminado com sucesso." });
        }
    }
}