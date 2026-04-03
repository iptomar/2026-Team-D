using Formify.Server.Data;
using Formify.Server.DTOs;
using Formify.Server.Models;
using Microsoft.AspNetCore.Mvc;

namespace Formify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FormsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FormsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateFormRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "O nome do formulário é obrigatório." });
            }

            var form = new Form
            {
                Name = request.Name.Trim(),
                Description = string.IsNullOrWhiteSpace(request.Description)
                    ? null
                    : request.Description.Trim(),
                Status = "Draft",
                SchemaJson = "{}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Forms.Add(form);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = form.Id }, form);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var form = await _context.Forms.FindAsync(id);

            if (form == null)
            {
                return NotFound();
            }

            return Ok(form);
        }
    }
}