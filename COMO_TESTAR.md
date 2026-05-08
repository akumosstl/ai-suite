# Como Testar a Funcionalidade de Plugins

## Pré-requisitos

1. Backend e Frontend compilados
2. Backend rodando na porta 8080
3. Frontend rodando (normalmente porta 4200)

## Passo a Passo

### 1. Iniciar o Backend

```bash
cd backend
mvn spring-boot:run
```

### 2. Testar o Endpoint

Com o backend rodando, teste o endpoint:

```bash
curl http://localhost:8080/api/plugins/registry
```

**Resposta esperada** (se o arquivo plugins.json estiver acessível):
```json
{
  "plugins": [
    {
      "name": "auth-plugin",
      "version": "1.0.0",
      "namespace": "com.company.security",
      "documentationUrl": "https://docs.company.com/plugins/auth-plugin",
      "download": ""
    }
  ]
}
```

**Se o arquivo não estiver disponível**, a resposta será:
```json
{
  "plugins": [],
  "error": "Failed to fetch plugins from registry: ..."
}
```

### 3. Iniciar o Frontend

```bash
cd desktop-angular
npm start
```

### 4. Acessar a Aplicação

1. Abra o navegador em `http://localhost:4200`
2. Navegue até qualquer página de projeto
3. Clique no menu **"Plugins"** na barra superior

### 5. Testar o Modal

Deve abrir um modal com:
- Título "Plugins"
- Painel esquerdo com lista de plugins (ou mensagem "No plugins available")
- Painel direito com instrução para selecionar um plugin

### 6. Testar com Arquivo Local (Opcional)

Se quiser testar com um arquivo local:

**a. Criar arquivo plugins.json:**
```json
{
  "plugins": [
    {
      "name": "teste-plugin",
      "version": "1.0.0",
      "namespace": "com.teste",
      "documentationUrl": "https://www.google.com",
      "download": ""
    }
  ]
}
```

**b. Servir o arquivo localmente:**
```bash
# Usando Python
python -m http.server 8000

# Ou usando Node.js
npx http-server -p 8000
```

**c. Configurar no backend:**
Edite `application.properties`:
```properties
plugins.registry.url=http://localhost:8000/plugins.json
```

**d. Reiniciar o backend e testar novamente**

## Testes Específicos

### Testar Paginação
1. Adicione mais de 10 plugins no JSON
2. Verifique se a paginação aparece
3. Navegue entre as páginas

### Testar Seleção
1. Clique em um plugin na lista
2. Verifique se o painel direito exibe os detalhes
3. Clique em "Open Documentation" e valide se abre a documentação

### Testar Responsividade
1. Redimensione a janela
2. Verifique se o modal mantém 75% do tamanho

### Testar Erros
1. Remova o arquivo plugins.json do servidor
2. Reinicie o backend
3. Verifique se a mensagem de erro aparece
4. O modal deve mostrar "No plugins available"

## Validação do Schema

O JSON deve seguir estritamente este schema:

```json
{
  "plugins": [
    {
      "name": "string (obrigatório)",
      "version": "string (obrigatório)",
      "namespace": "string (obrigatório)",
      "documentationUrl": "string (obrigatório)",
      "download": "string (opcional)"
    }
  ]
}
```

**Campos obrigatórios:**
- `name`: Nome do plugin
- `version`: Versão no formato semver (ex: 1.0.0)
- `namespace`: Namespace Java (ex: com.example.plugin)
- `documentationUrl`: URL válida da documentação

**Campos opcionais:**
- `download`: URL para download do arquivo do plugin

## Debug

### Backend
```bash
# Ver logs do backend
tail -f backend/logs/application.log

# Testar endpoint diretamente
curl -v http://localhost:8080/api/plugins/registry
```

### Frontend
```bash
# Ver console do navegador (F12)
# Procure por erros no console
# Verifique requisições na aba Network
```

## Problemas Comuns

### 1. "No plugins available"
- Verifique se o arquivo plugins.json está acessível
- Teste a URL no navegador
- Verifique CORS se estiver servindo de outro domínio

### 2. Modal não abre
- Verifique se o menu "Plugins" está visível
- Confirme se o backend está rodando
- Verifique console do navegador por erros

### 3. Documentação não carrega
- Verifique se documentationUrl é válido
- Teste a URL diretamente no navegador
- Verifique se o site permite iframe (X-Frame-Options)

## Validação Final

✅ Menu "Plugins" visível na barra superior
✅ Modal abre ao clicar
✅ Lista de plugins exibida (ou mensagem de vazio)
✅ Paginação funciona (se houver mais de 10 plugins)
✅ Clique no plugin mostra detalhes
✅ Documentação carrega no iframe
✅ Botões de ação funcionam
✅ Botão Cancel fecha o modal

## Próximos Passos

1. Criar repositório `akumosstl.github.io` no GitHub
2. Adicionar arquivo `plugins.json` com plugins reais
3. Testar com plugins reais
4. Coletar feedback dos usuários
