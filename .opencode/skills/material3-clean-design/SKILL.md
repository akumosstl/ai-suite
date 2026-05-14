---
name: material3-clean-design
description: Angular Material v21 (M3) design refactoring - eliminate !important overrides and deep MDC selectors, converting them to Material 3 semantic design tokens
---

# Skill: Angular Material v21 (M3) Design & Refactoring

## Contexto do Projeto
- Framework: Angular v21
- Biblioteca de UI: Angular Material ^21.2.8 (Strict Material 3)
- Pré-processador: Sass configurado com Módulos (`@use '@angular/material' as mat;`)
- Sintaxe dos Componentes: Templates nativos (`mat-icon`, `mat-form-field`, `mat-paginator`, etc.) com aproximadamente 583 referências globais.

## Missão Principal
Eliminar o anti-padrão de sobrescrita visual baseada em `!important` e seletores MDC profundos (tanto no `styles.scss` global quanto nos arquivos `*.component.scss` locais), convertendo-os em Design Tokens semânticos do Material 3.

## Diretrizes Mandatórias de Refatoração

### 1. Tema Global (`src/styles.scss`)
- Configurar o mixin `@include mat.theme` no seletor `html` utilizando obrigatoriamente a propriedade `theme-type: dark` dentro do mapa de `color`.
- Remover cores estáticas em formato hexadecimal (ex: `#1a1a1a`, `#ffffff`) de tags estruturais como `body`. Em vez disso, utilizar os tokens de sistema: `var(--mat-sys-surface)` e `var(--mat-sys-on-surface)`.
- Eliminar os blocos globais com `!important` voltados a componentes (`.mat-mdc-button`, `.mat-mdc-card`, etc.). Substituí-los mapeando as propriedades customizadas do projeto para as variáveis de escopo `:root` do M3 (ex: `--mat-sys-surface-container`, `--mat-sys-surface-container-high`).

### 2. Estilos Locais (`*.component.scss`)
- É expressamente proibido o uso de `!important` e seletores de classes utilitárias internas do Material nos componentes locais.
- Toda customização de componente local deve ser encapsulada dentro do seletor `:host`.
- Traduzir propriedades customizadas locais (background, borders, paddings) para as variáveis CSS nativas de cada componente MDC (ex: `--mdc-filled-text-field-container-color`, `--mdc-filled-text-field-container-shape`).
- Manter intactas as lógicas de negócio dos arquivos TypeScript e as tags estruturais dos arquivos HTML.
