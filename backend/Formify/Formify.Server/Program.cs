using Formify.Server.Data;
using Formify.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Em ambiente de desenvolvimento, gerar uma JWT key aleatória a cada arranque.
// Isto invalida todos os tokens emitidos antes do restart, forçando o utilizador
// a re-autenticar-se (comportamento desejado em dev para evitar sessões "fantasma"
// entre runs). Em produção lê a chave de configuração, como antes.
if (builder.Environment.IsDevelopment())
{
    var randomKey = Convert.ToBase64String(
        System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
    builder.Configuration["Jwt:Key"] = randomKey;
}

// Add services to the container.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            //Line to extract the Error Messages defined in each DTO Field 
            var problemDetails = new ValidationProblemDetails(context.ModelState)
            {
                Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
                Title = "One or more validation errors occurred.",
                Status = StatusCodes.Status400BadRequest,
                Detail = "The request data does not match the DTO specification.",
                Instance = context.HttpContext.Request.Path
            };

            return new BadRequestObjectResult(problemDetails);
        };
    });
builder.Services.AddOpenApi();

// services
builder.Services.AddSingleton<JsonHandler>();
builder.Services.AddSingleton<UsersService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:56709", "https://localhost:56710")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure JWT authentication
var jwtKey = builder.Configuration["Jwt:Key"] ?? "dev-secret-key-please-change";
var keyBytes = Encoding.UTF8.GetBytes(jwtKey);
// Ensure key is at least 256 bits for HMAC-SHA256; if shorter, derive a 256-bit key using SHA256
if (keyBytes.Length < 32)
{
    using var sha = System.Security.Cryptography.SHA256.Create();
    keyBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(jwtKey));
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(keyBytes)
    };
});

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

//app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

//Meter depois: app.MapFallbackToFile("/Landing.jsx");
app.MapFallbackToFile("/index.html");

app.Run();
