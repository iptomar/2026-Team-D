using Formify.Server.Models;
using Formify.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;

namespace Formify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UsersService _usersService;
        private readonly IConfiguration _config;

        public AuthController(UsersService usersService, IConfiguration config)
        {
            _usersService = usersService;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password) || string.IsNullOrWhiteSpace(dto.Role))
                return BadRequest(new { error = "Todos os campos são obrigatórios." });

            var allowedRoles = new[] { "professor", "funcionario" };
            if (!allowedRoles.Contains(dto.Role.ToLower()))
                return BadRequest(new { error = "Role inválida." });

            var existing = await _usersService.GetByUsernameAsync(dto.Username);
            if (existing != null)
                return Conflict(new { error = "Username já existe." });

            var (hash, salt) = _usersService.HashNewPassword(dto.Password);
            var user = new UserModel
            {
                Name = dto.Name,
                Username = dto.Username,
                PasswordHash = Convert.ToBase64String(hash),
                Salt = Convert.ToBase64String(salt),
                Role = dto.Role.ToLower()
            };

            await _usersService.AddUserAsync(user);
            return Ok(new { message = "Utilizador criado com sucesso." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { error = "Username e password são obrigatórios." });

            var user = await _usersService.GetByUsernameAsync(dto.Username);
            if (user == null)
                return Unauthorized(new { error = "Credenciais inválidas." });

            if (!_usersService.VerifyPassword(dto.Password, user.Salt, user.PasswordHash))
                return Unauthorized(new { error = "Credenciais inválidas." });

            // generate JWT
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtKey = _config["Jwt:Key"] ?? "dev-secret-key-please-change";
            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
            if (keyBytes.Length < 32)
            {
                using var sha = SHA256.Create();
                keyBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(jwtKey));
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(12),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwt = tokenHandler.WriteToken(token);

            return Ok(new { token = jwt, role = user.Role, username = user.Username });
        }

        [HttpGet("user/{username}")]
        //[Authorize]
        public async Task<IActionResult> GetUserByUsername(string username)
        {
            if (string.IsNullOrWhiteSpace(username))
                return BadRequest(new { error = "Username é obrigatório." });

            var user = await _usersService.GetByUsernameAsync(username);
            if (user == null)
                return NotFound(new { error = "Utilizador não encontrado." });

            return Ok(new
            {
                id = user.Id,
                name = user.Name,
                username = user.Username,
                role = user.Role
            });
        }
    
        // GET /api/auth/me
        // Valida o token JWT do utilizador autenticado e devolve os dados atuais.
        // O frontend usa esta chamada no arranque para detetar tokens revogados,
        // utilizadores entretanto removidos ou estados inconsistentes (devolve 401).
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(idClaim) || !int.TryParse(idClaim, out var userId))
            {
                return Unauthorized(new { error = "Token inválido." });
            }

            var users = await _usersService.GetAllAsync();
            var user = users.FirstOrDefault(u => u.Id == userId);
            if (user == null)
            {
                return Unauthorized(new { error = "Utilizador já não existe." });
            }

            return Ok(new
            {
                userId = user.Id,
                username = user.Username,
                name = user.Name,
                role = user.Role
            });
        }
    }

    public class RegisterDto
    {
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class LoginDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
