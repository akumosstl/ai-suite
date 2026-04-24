# Plugins Registry

Este arquivo contém a lista de plugins disponíveis para o Agentic AI Suite.

## Como usar

O arquivo `plugins.json` deve estar disponível em:
```
https://github.com/akumosstl/akumosstl.github.io/blob/main/plugins.json
```

## Estrutura do JSON

```json
{
  "plugins": [
    {
      "name": "nome-do-plugin",
      "version": "1.0.0",
      "namespace": "com.example.plugin",
      "documentationUrl": "https://docs.exemplo.com/plugin",
      "download": ""
    }
  ]
}
```

## Exemplo de plugins.json

```json
{
  "plugins": [
    {
      "name": "auth-plugin",
      "version": "1.0.0",
      "namespace": "com.company.security",
      "documentationUrl": "https://docs.company.com/plugins/auth-plugin",
      "download": ""
    },
    {
      "name": "payment-plugin",
      "version": "2.3.1",
      "namespace": "com.company.finance",
      "documentationUrl": "https://docs.company.com/plugins/payment-plugin",
      "download": ""
    },
    {
      "name": "notification-plugin",
      "version": "1.5.4",
      "namespace": "com.company.communication",
      "documentationUrl": "https://docs.company.com/plugins/notification-plugin",
      "download": ""
    }
  ]
}
```

## Campos

- **name**: Nome do plugin
- **version**: Versão do plugin (formato semver: major.minor.patch)
- **namespace**: Namespace Java do plugin
- **documentationUrl**: URL da documentação do plugin (será aberta no modal)
- **download**: URL para download do plugin (opcional)

## Testando

Para testar se o arquivo está acessível:
```bash
curl https://raw.githubusercontent.com/akumosstl/akumosstl.github.io/main/plugins.json
```
