using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Formify.Server.Models;

namespace Formify.Server.Services
{
    public class UsersService
    {
        private readonly string _filePath;
        private readonly object _fileLock = new object();

        public UsersService()
        {
            _filePath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "users.json");
            EnsureSeedAsync().GetAwaiter().GetResult();
        }

        private async Task EnsureSeedAsync()
        {
            var dir = Path.GetDirectoryName(_filePath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);

            if (!File.Exists(_filePath))
            {
                var users = new List<UserModel>
                {
                    CreateHashedUser(1, "Admin One", "admin1", "AdminPass1!", "admin"),
                    CreateHashedUser(2, "Admin Two", "admin2", "AdminPass2!", "admin")
                };

                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(users, options);
                await File.WriteAllTextAsync(_filePath, json);
            }
        }

        private UserModel CreateHashedUser(int id, string name, string username, string password, string role)
        {
            var salt = GenerateSalt();
            var hash = HashPassword(password, salt);
            return new UserModel
            {
                Id = id,
                Name = name,
                Username = username,
                PasswordHash = Convert.ToBase64String(hash),
                Salt = Convert.ToBase64String(salt),
                Role = role
            };
        }

        public Task<List<UserModel>> GetAllAsync()
        {
            if (!File.Exists(_filePath)) return Task.FromResult(new List<UserModel>());
            try
            {
                var json = File.ReadAllText(_filePath);
                var list = JsonSerializer.Deserialize<List<UserModel>>(json);
                return Task.FromResult(list ?? new List<UserModel>());
            }
            catch
            {
                return Task.FromResult(new List<UserModel>());
            }
        }

        public async Task<UserModel?> GetByUsernameAsync(string username)
        {
            var users = await GetAllAsync();
            return users.FirstOrDefault(u => u.Username.Equals(username, StringComparison.OrdinalIgnoreCase));
        }

        public async Task AddUserAsync(UserModel user)
        {
            lock (_fileLock)
            {
                var users = GetAllAsync().GetAwaiter().GetResult();
                user.Id = users.Any() ? users.Max(u => u.Id) + 1 : 1;
                users.Add(user);
                var options = new JsonSerializerOptions { WriteIndented = true };
                var json = JsonSerializer.Serialize(users, options);
                File.WriteAllText(_filePath, json);
            }
            await Task.CompletedTask;
        }

        public bool VerifyPassword(string password, string saltBase64, string hashBase64)
        {
            var salt = Convert.FromBase64String(saltBase64);
            var hash = Convert.FromBase64String(hashBase64);
            var computed = HashPassword(password, salt);
            return CryptographicOperations.FixedTimeEquals(computed, hash);
        }

        public (byte[] hash, byte[] salt) HashNewPassword(string password)
        {
            var salt = GenerateSalt();
            var hash = HashPassword(password, salt);
            return (hash, salt);
        }

        private byte[] GenerateSalt()
        {
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[16];
            rng.GetBytes(salt);
            return salt;
        }

        private byte[] HashPassword(string password, byte[] salt)
        {
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100_000, HashAlgorithmName.SHA256);
            return pbkdf2.GetBytes(32);
        }
    }
}
