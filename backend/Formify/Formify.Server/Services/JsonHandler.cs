using Formify.Server.Models;
using System.Text.Json;

namespace Formify.Server.Services
{
    public class JsonHandler
    {
        //Pode vir a dar jeito.
        private readonly string _filePathElements = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "formify.client",
            "Schema",
            "FormElements.json"
        );

        //Caminho do Json onde estão os formulários.
        private readonly string _filePathList = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "formify.client",
            "Schema",
            "FormsList.json"
        );

        public async Task<List<Form>> GetAllFormsAsync()
        {
            if (!File.Exists(_filePathList))
            {
                return new List<Form>();
            }

            try
            {
                var json = await File.ReadAllTextAsync(_filePathList);
                // Deserialize the list of forms from the file
                return JsonSerializer.Deserialize<List<Form>>(json) ?? new List<Form>();
            }
            catch
            {
                // If the file is empty or corrupted, return an empty list
                return new List<Form>();
            }
        }

        public async Task SaveFormsAsync(List<Form> forms)
        {
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(forms, options);
            await File.WriteAllTextAsync(_filePathList, json);
        }
    }
}