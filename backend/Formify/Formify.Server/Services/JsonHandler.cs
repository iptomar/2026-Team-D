using Formify.Server.Models;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace Formify.Server.Services
{
    public class JsonHandler
    {
        // Serializer partilhado: enums escritos como string (ex: "Draft"),
        // case-insensitive na leitura, output indentado.
        private static readonly JsonSerializerOptions JsonOpts = new()
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true,
            Converters = { new JsonStringEnumConverter(allowIntegerValues: true) }
        };

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

        private readonly string _filePathSubmissions = Path.Combine(
            Directory.GetCurrentDirectory(),
            "..",
            "formify.client",
            "Schema",
            "SubmissionsList.json"
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
                if (string.IsNullOrWhiteSpace(json)) return new List<Form>();

                // Migração transparente: se algum form ainda tem `StatusDrafted`
                // ou `Archived` em vez do novo campo `Status`, derivamos o valor.
                var array = JsonNode.Parse(json) as JsonArray;
                if (array == null) return new List<Form>();

                bool needsResave = false;
                foreach (var item in array.OfType<JsonObject>())
                {
                    if (item["Status"] == null && item["status"] == null)
                    {
                        var archived = (item["Archived"] ?? item["archived"])?.GetValue<bool>() ?? false;
                        var drafted = (item["StatusDrafted"] ?? item["statusDrafted"])?.GetValue<bool>() ?? false;
                        var status = archived ? "Archived" : drafted ? "Draft" : "Published";
                        item["Status"] = status;
                        item.Remove("Archived"); item.Remove("archived");
                        item.Remove("StatusDrafted"); item.Remove("statusDrafted");
                        needsResave = true;
                    }
                }

                var forms = JsonSerializer.Deserialize<List<Form>>(array.ToJsonString(), JsonOpts)
                            ?? new List<Form>();

                if (needsResave)
                {
                    await SaveFormsAsync(forms);
                }

                return forms;
            }
            catch
            {
                // If the file is empty or corrupted, return an empty list
                return new List<Form>();
            }
        }

        public async Task SaveFormsAsync(List<Form> forms)
        {
            var json = JsonSerializer.Serialize(forms, JsonOpts);
            await File.WriteAllTextAsync(_filePathList, json);
        }

        public async Task<List<Submission>> GetAllSubmissionsAsync()
        {
            if (!File.Exists(_filePathSubmissions))
            {
                return new List<Submission>();
            }

            try
            {
                var json = await File.ReadAllTextAsync(_filePathSubmissions);
                return JsonSerializer.Deserialize<List<Submission>>(json, JsonOpts) ?? new List<Submission>();
            }
            catch
            {
                return new List<Submission>();
            }
        }

        public async Task SaveSubmissionsAsync(List<Submission> submissions)
        {
            var json = JsonSerializer.Serialize(submissions, JsonOpts);
            await File.WriteAllTextAsync(_filePathSubmissions, json);
        }
    }
}
