# Funcionalidade de Plugins

## Visão Geral
O sistema de plugins permite carregar e gerenciar plugins dinamicamente através de um registry JSON externo.

## Estrutura

### Backend
- **PluginRegistryController**: Endpoint REST que busca plugins de um registry externo
- **Endpoint**: `/api/plugins/registry`
- **Configuração**: A URL do registry pode ser configurada via propriedade `plugins.registry.url`

### Frontend
- **PluginsModalComponent**: Modal que exibe lista de plugins disponíveis
- **Paginação**: 10 plugins por página
- **Documentação**: Ao clicar em um plugin, abre a documentação em um iframe

## JSON Schema

O registry de plugins deve seguir o seguinte schema:

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

## Configuração

### Propriedades
```properties
# URL do registry de plugins (opcional)
# Padrão: https://raw.githubusercontent.com/akumosstl/akumosstl.github.io/main/plugins.json
plugins.registry.url=https://raw.githubusercontent.com/akumosstl/akumosstl.github.io/main/plugins.json
```

### Exemplo de Registry JSON
```json
{
  "plugins": [
    {
      "name": "auth-plugin",
      "version": "1.0.0",
      "namespace": "com.company.security",
      "documentationUrl": "https://docs.company.com/plugins/auth-plugin",
      "download": "https://github.com/company/auth-plugin/releases/download/v1.0.0/auth-plugin.jar"
    },
    {
      "name": "payment-plugin",
      "version": "2.3.1",
      "namespace": "com.company.finance",
      "documentationUrl": "https://docs.company.com/plugins/payment-plugin",
      "download": "https://github.com/company/payment-plugin/releases/download/v2.3.1/payment-plugin.jar"
    }
  ]
}
```

## Uso

### Menu Plugins
1. Acesse qualquer página do projeto
2. Clique no menu **Plugins** na barra superior
3. O modal abrirá exibindo os plugins disponíveis
4. Clique em um plugin para ver sua documentação
5. Use os botões de navegação para paginar a lista

### Funcionalidades
- **Lista paginada**: 10 plugins por página
- **Documentação integrada**: Visualize a documentação sem sair do modal
- **Download direto**: Link para download do plugin (se disponível)
- **Informações detalhadas**: Nome, versão e namespace do plugin

## Implementação

### Backend
- `PluginRegistryController.java`: Controlador REST para buscar plugins
- Usa `RestTemplate` para buscar JSON de registry externo
- Tratamento de erro com fallback para lista vazia

### Frontend
- `plugins-modal.component.ts`: Componente do modal
- `api.service.ts`: Serviço com método `getPluginRegistry()`
- Integração com Material UI (paginator, dialog, etc.)

## Arquivos Criados

### Backend
- `backend/src/main/java/io/github/akumosstl/agentic/backend/controller/PluginRegistryController.java`
- `backend/src/main/resources/plugins-registry-example.json`

### Frontend
- `desktop-angular/src/app/components/plugins-modal/plugins-modal.component.ts`
- `desktop-angular/src/app/app.scss`
- `desktop-angular/src/app/services/api.service.ts` (atualizado)
- `desktop-angular/src/app/components/menu-bar/menu-bar.component.ts` (atualizado)

## Testes

### Backend
```bash
cd backend
mvn test -Dtest=PluginRegistryControllerTest
```

### Frontend
```bash
cd desktop-angular
npm test -- plugins-modal
```

## Notas
- O registry de plugins é opcional. Se a URL não estiver disponível, o sistema retorna uma lista vazia.
- A URL padrão aponta para a Wiki do repositório no GitHub.
- O iframe de documentação usa sandbox para segurança.
