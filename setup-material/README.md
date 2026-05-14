# setup-material

Framework reutilizavel para migrar projetos Angular Material v21 para o design system M3 (Material 3) com boas praticas de acessibilidade, performance e consistencia visual.

## Estrutura de Arquivos

```
setup-material/
  README.md                        # Este arquivo - guia de uso
  _m3-theme-tokens.md              # Referencia de tokens M3 (cores, tipografia, elevation, shape)
  _style-audit.md                  # Checklist de auditoria de estilos
  _design-system.md                # Arquitetura do design system (SCSS partials, mixins, variaveis)
  _migration-patterns.md           # Padroes before/after para migracao
  SKILL-apply-m3-style.md          # Skill principal - orquestra toda a migracao (5 fases)
  SKILL-m3-global-theme.md         # Skill - refactor do styles.scss global
  SKILL-m3-component-refactor.md   # Skill - refactor por componente
  SKILL-m3-a11y-perf.md            # Skill - acessibilidade e performance
```

## Como Usar com OpenCode

### Opcao 1: Copiar skills para `.opencode/skills/`

Copie os arquivos `SKILL-*.md` para a pasta `.opencode/skills/` do seu projeto para que o OpenCode possa carrega-los como skills nativas:

```bash
# No root do seu projeto Angular
mkdir -p .opencode/skills
cp setup-material/SKILL-*.md .opencode/skills/
cp setup-material/_*.md .opencode/skills/
```

Depois, no OpenCode, referencie a skill pelo nome:

```
> Use the skill "apply-m3-style" to migrate my project
```

### Opcao 2: Usar como instrucao direta no prompt

Cole o conteudo do `SKILL-apply-m3-style.md` diretamente no prompt do OpenCode como contexto, junto com os arquivos de referencia necessarios.

### Opcao 3: Referenciar no AGENTS.md

Adicione ao `AGENTS.md` do projeto:

```markdown
## M3 Design System Migration
When asked to migrate styles to Material 3, follow the instructions in:
- `setup-material/SKILL-apply-m3-style.md` (orchestrator)
- `setup-material/SKILL-m3-global-theme.md` (global theme)
- `setup-material/SKILL-m3-component-refactor.md` (per-component)
- `setup-material/SKILL-m3-a11y-perf.md` (a11y & perf)
Reference files:
- `setup-material/_m3-theme-tokens.md` (token mapping)
- `setup-material/_design-system.md` (SCSS architecture)
- `setup-material/_migration-patterns.md` (before/after patterns)
- `setup-material/_style-audit.md` (audit checklist)
```

---

## Exemplo de Uso Completo

### Cenario: Replicar o estilo da pagina `/logs` para as demais paginas

**Prompt no OpenCode**:

```
Quero migrar todo o frontend para usar o design system M3 do Angular Material v21.
A pagina /logs tem o melhor estilo e deve servir como referencia.
Siga o framework em setup-material/SKILL-apply-m3-style.md.

Fase 1: Faca o style audit completo do projeto
Fase 2: Crie o design system (SCSS partials) em src/styles/
Fase 3: Refactor o styles.scss global eliminando !important
Fase 4: Migre cada componente comecando pela pagina /logs (referencia)
Fase 5: Aplique a11y e performance best practices
```

**Execucao passo a passo**:

#### Fase 1 - Audit
```
> Faca o style audit seguindo setup-material/_style-audit.md
```
O OpenCode ira:
- Contar `!important` em `styles.scss` (resultado esperado: ~30)
- Contar `::ng-deep` nos componentes (resultado esperado: ~5)
- Catalogar cores hex duplicadas (resultado esperado: ~15 unicas)
- Identificar padroes repetidos (page-container, left-panel, icon-btn, etc.)
- Definir ordem de prioridade para migracao

#### Fase 2 - Design System
```
> Crie os SCSS partials seguindo setup-material/_design-system.md
```
O OpenCode ira criar:
- `src/styles/_tokens.scss` - Token semanticos
- `src/styles/_layout.scss` - Mixins de layout
- `src/styles/_components.scss` - Mixins de componentes UI
- `src/styles/_data-display.scss` - Mixins de tabela/card
- `src/styles/_states.scss` - Mixins de estados
- `src/styles/_a11y.scss` - Utilidades de acessibilidade
- Configurar `angular.json` com `stylePreprocessorOptions`

#### Fase 3 - Tema Global
```
> Refactor o styles.scss seguindo setup-material/SKILL-m3-global-theme.md
```
O OpenCode ira:
- Adicionar `theme-type: dark` ao `mat.theme()`
- Substituir cores hex em `body` por `var(--mat-sys-*)`
- Converter cada bloco `!important` para variaveis CSS em `:root`
- Resultado: `styles.scss` limpo sem `!important` em componentes

#### Fase 4 - Migracao por Componente
```
> Migre o componente logs seguindo setup-material/SKILL-m3-component-refactor.md
```
```
> Migre o componente agents seguindo setup-material/SKILL-m3-component-refactor.md
```
```
> Migre o componente scripts seguindo setup-material/SKILL-m3-component-refactor.md
```
(repetir para cada pagina)

O OpenCode ira, para cada componente:
- Converter inline styles para `.scss` externo
- Substituir hex por `var(--mat-sys-*)`
- Substituir padroes repetidos por `@include` de mixins
- Eliminar `::ng-deep` e `!important`
- Rodar `npm run build` para verificar

#### Fase 5 - A11y & Performance
```
> Aplique a11y e performance seguindo setup-material/SKILL-m3-a11y-perf.md
```
O OpenCode ira:
- Adicionar `aria-label` em todos `mat-icon-button`
- Adicionar focus-visible global
- Verificar granularidade de imports do Material
- Adicionar `@defer` em dialogos pesados
- Configurar BreakpointObserver para responsividade

---

## Como Adaptar para Outros Projetos

### 1. Ajustar Paleta de Cores

Em `_design-system.md` e `_m3-theme-tokens.md`, os tokens `--mat-sys-*` se resolvem automaticamente com base na paleta configurada no `mat.theme()`. Basta alterar:

```scss
@include mat.theme((
  color: (
    primary: mat.$violet-palette,    // Troque a paleta
    tertiary: mat.$rose-palette,     // Troque a paleta
    theme-type: dark,                // ou 'light'
  ),
  typography: 'Inter',               // Troque a fonte
  density: -1,                       // Ajuste densidade (0=default, -1=compact)
));
```

### 2. Ajustar Spacing e Typography Scale

Em `_design-system.md`, modifique os mapas `$spacing`, `$font-size`, `$radius` conforme o design do projeto.

### 3. Light Theme

Para projetos com tema claro, basta remover `theme-type: dark` ou usar `theme-type: light`. Os tokens `var(--mat-sys-*)` se resolvem automaticamente para valores claros.

### 4. Projetos com Tailwind

Se o projeto usa Tailwind + Angular Material:
- Mantenha os SCSS partials para componentes Material
- Use Tailwind utilities apenas no HTML template
- NAO duplique estilos entre Tailwind e SCSS

---

## Arquivos de Referencia Rapida

| Arquivo | Quando Usar |
|---------|-------------|
| `_m3-theme-tokens.md` | Precisa saber qual token M3 usar para uma cor/borda/shadow |
| `_style-audit.md` | Inicio do projeto - catalogar problemas antes de migrar |
| `_design-system.md` | Criar os SCSS partials compartilhados |
| `_migration-patterns.md` | Ver exemplo before/after de um padrao especifico |
| `SKILL-apply-m3-style.md` | Orquestrar a migracao completa (5 fases) |
| `SKILL-m3-global-theme.md` | Refactorar apenas o `styles.scss` global |
| `SKILL-m3-component-refactor.md` | Refactorar um componente especifico |
| `SKILL-m3-a11y-perf.md` | Aplicar a11y e performance no final |

---

## Resumo das Boas Praticas M3

1. **M3 nativo**: Use `@include mat.theme(...)` com `theme-type: dark`, nunca override manual
2. **Zero `!important`**: Substitua por variaveis CSS em `:root` ou `:host`
3. **Zero `::ng-deep`**: Substitua por MDC CSS custom properties
4. **SCSS partials**: Crie design system compartilhado, nao duplique CSS
5. **Tokens semanticos**: Use `var(--mat-sys-*)` no lugar de hex hardcoded
6. **Imports granulares**: `@angular/material/button`, nao `@angular/material`
7. **Standalone**: Todo componente `standalone: true`, sem NgModules
8. **Deferred loading**: `@defer` para dialogos e abas pesadas
9. **ARIA labels**: Todo `mat-icon-button` com `aria-label`
10. **CDK BreakpointObserver**: Responsividade sem `@angular/flex-layout`
