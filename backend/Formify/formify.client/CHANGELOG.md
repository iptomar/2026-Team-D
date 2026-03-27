Este arquivo explica como Visual Studio criou o projeto.

As seguintes ferramentas foram usadas para gerar este projeto:
- create-vite

As etapas a seguir foram usadas para gerar este projeto:
- Crie um projeto react com create-vite: `npm init --yes vite@latest formify.client -- --template=react  --no-rolldown --no-immediate`.
- Atualize `vite.config.js` para configurar o proxy e os certificados.
- Atualize o componente `App` para buscar e exibir informações meteorológicas.
- Criar o arquivo de projeto (`formify.client.esproj`).
- Crie `launch.json` para habilitar a depuração.
- Adicionar projeto à solução.
- Atualize o ponto de extremidade do proxy para ser o ponto de extremidade do servidor back-end.
- Adicione o projeto à lista de projetos de inicialização.
- Grave este arquivo.
