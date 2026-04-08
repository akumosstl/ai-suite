# Plano de Correção: Erro ao Executar Step com Agent opencode

## Problema

O step falha ao executar o agent `akm-architect-planner.md` com o erro:
```
'modify' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.
```

## Análise

**Causa raiz identificada**: O prompt do agent contém caracteres especiais do shell Windows (`|` pipe) que não estão sendo escapados corretamente quando passados para o `opencode run`.

No prompt do agent, há a linha:
```
"action": "create | modify | delete",
```

Quando o prompt completo é passado como argumento para `opencode run` no Windows CMD, o caractere `|` (pipe) é interpretado como um operador de pipe do shell, causando a misinterpretação do comando.

## Tasks

### Task 1: Identificar e Corrigir o Escape de Caracteres Especiais no PipelineStepService

**Arquivo**: `backend/src/main/java/io/github/akumosstl/agentic/backend/service/PipelineStepService.java`

**Problema**: O prompt é passado diretamente para o comando sem escape adequado dos caracteres especiais do Windows CMD.

**Linha aproximada**: 701 e 710 (onde o prompt é appendado ao comando)

Código atual:
```java
fullCommand.append(" \"").append(prompt.replace("\"", "\\\"").replace("\r", "").replace("\n", " ")).append("\"");
```

**Solução**: Adicionar escape para `|` (pipe), `&` (ampersand), `>`, `<`, `^` e outros caracteres especiais do Windows CMD.

---

### Task 2: Testar opencode run Via Backend para Confirmar Comportamento

**Objetivo**: Verificar como o opencode CLI se comporta quando executado via processo Java no Windows.

**Teste manual**: Executar o comando que seria construído pelo backend diretamente no terminal para observar o comportamento.

```cmd
opencode run "teste com pipe | character"
```

---

### Task 3: Implementar Escape Adequado para Windows CMD

**Solução proposta**: Criar um método utilitário que escape todos os caracteres especiais do Windows CMD:

```java
private String escapeWindowsCommand(String input) {
    if (input == null) return "";
    return input
        .replace("\"", "\"\"")
        .replace("%", "%%")
        .replace("^", "^^")
        .replace("&", "^&")
        .replace("|", "^|")
        .replace("<", "^<")
        .replace(">", "^>")
        .replace("\r", "")
        .replace("\n", " ");
}
```

Alternativamente, usar aspas duplas extras ao redor do prompt.

---

### Task 4: Verificar Outras Ocorrências de Escape de Prompt

**Objetivo**: Garantir que todas as partes do código que constroem comandos para execução verificam escape adequado.

**Arquivos a verificar**:
- `PipelineStepService.java` - linha ~701 (opencode)
- `PipelineStepService.java` - linha ~710 (opencode)
- `PipelineStepService.java` - linha ~693-700 (copilot/other CLI)

---

### Task 5: Teste de Integração

**Objetivo**: Executar o pipeline novamente e verificar se o step executa sem erros.

---

## Cronograma Sugerido

1. Task 1: Análise de código (30 min)
2. Task 2: Teste manual (15 min)
3. Task 3: Implementar correção (30 min)
4. Task 4: Verificar outros pontos (15 min)
5. Task 5: Teste de integração (15 min)

## Referências

- Documentação Windows CMD escape: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd
- PipelineStepService.java: linhas ~685-730 (construção do comando)