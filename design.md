---
name: Humanitarian Case Management System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3f4945'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6f7975'
  outline-variant: '#bfc9c4'
  surface-tint: '#236958'
  primary: '#005243'
  on-primary: '#ffffff'
  primary-container: '#256b5a'
  on-primary-container: '#a4e9d3'
  inverse-primary: '#90d4bf'
  secondary: '#166965'
  on-secondary: '#ffffff'
  secondary-container: '#a6f0ea'
  on-secondary-container: '#206f6b'
  tertiary: '#644119'
  on-tertiary: '#ffffff'
  tertiary-container: '#7f582f'
  on-tertiary-container: '#ffd3ab'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#abf0db'
  primary-fixed-dim: '#90d4bf'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005141'
  secondary-fixed: '#a6f0ea'
  secondary-fixed-dim: '#8ad3ce'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504c'
  tertiary-fixed: '#ffdcbd'
  tertiary-fixed-dim: '#f0bd8b'
  on-tertiary-fixed: '#2c1600'
  on-tertiary-fixed-variant: '#623f18'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  data-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-margin: 24px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-padding: 48px
---

## Brand & Style

O sistema de design é fundamentado na intersecção entre a eficiência técnica e a sensibilidade humanitária. O objetivo principal é criar um ambiente de trabalho que transmita segurança, clareza e profissionalismo para gestores de casos de Violência Baseada no Gênero (VBG).

A estética segue o movimento **Minimalista Moderno (2026)**, inspirado em ferramentas de alta performance como Vercel e Linear. A interface prioriza a densidade de informações sem sacrificar a legibilidade, utilizando:
- **Espaçamento Generoso:** Para reduzir a carga cognitiva em situações de alto stress.
- **Micro-interações Precisas:** Respostas imediatas que confirmam ações do usuário, reforçando a confiança no sistema.
- **Foco em Acessibilidade:** Contraste rigoroso e hierarquia visual clara, garantindo que as informações críticas sejam identificadas instantaneamente.

## Cores

A paleta é centrada no **Verde Profundo (#256B5A)**, uma cor que evoca estabilidade, crescimento e renovação, essencial para o contexto de apoio humanitário.

- **Primária:** Utilizada para ações principais e estados ativos.
- **Secundária (Teal Profissional):** Utilizada para elementos de suporte e categorização.
- **Tons Terrosos:** Acentos sutis que humanizam a interface fria do dashboard.
- **Neutros:** O fundo em Slate Suave reduz o cansaço visual durante longos períodos de exposição à tela.
- **Semântica:** Cores de status seguem padrões internacionais de segurança, com saturação ajustada para garantir legibilidade sobre fundos claros e escuros.

## Tipografia

A estratégia tipográfica divide-se em duas funções críticas:
1. **Inter (Sans):** A fonte principal para toda a interface de usuário, escolhida pela sua clareza excepcional e neutralidade. É utilizada para navegação, corpo de texto e títulos.
2. **JetBrains Mono:** Reservada exclusivamente para dados brutos, métricas de casos, IDs de processos e indicadores quantitativos. O design monoespaçado facilita a comparação vertical de números em tabelas e dashboards.

As escalas são otimizadas para leitura rápida, com pesos mais leves (400) para descrições e pesos semibold (600) para rotulagem funcional.

## Layout & Espaçamento

O sistema utiliza uma **Grelha Fluida de 12 colunas** para desktop, adaptando-se para 4 colunas em dispositivos móveis. O ritmo vertical é baseado num sistema de 4px, garantindo alinhamento matemático em todos os componentes.

- **Margens:** 24px fixos nas extremidades do ecrã para evitar que o conteúdo toque nas bordas físicas.
- **Gutters:** 16px para separação de cartões de informação.
- **Filosofia de Layout:** Utilização de `flexbox` e `grid` para criar dashboards modulares onde os widgets podem ser reordenados sem perder a coerência visual. O conteúdo crítico de cada caso deve ser visível no primeiro "fold" (dobra) da página.

## Elevação & Profundidade

Para manter a estética profissional de 2026, evitamos sombras pesadas ou skeuomorfismo excessivo. A profundidade é comunicada através de:

1. **Camadas Tonais:** O fundo principal é `#F8FAFC`, enquanto os cartões (cards) utilizam `#FFFFFF`. Esta diferença tonal sutil cria separação sem ruído visual.
2. **Sombras de Ambiente:** Sombras extremamente difusas e de baixa opacidade (Blur: 15px, Y: 4px, Color: `rgba(15, 23, 42, 0.08)`).
3. **Bordas de Baixo Contraste:** Em vez de sombras fortes, utilizamos bordas de 1px em `#E2E8F0` para definir limites de componentes em estado de repouso.
4. **Estados Ativos:** Elementos focados recebem um anel de brilho (ring) na cor primária com 2px de espessura e 4px de offset.

## Formas

A linguagem de formas é mista para equilibrar acolhimento e funcionalidade técnica:

- **Cartões e Contentores:** Utilizam um raio de **16px**. Esta curvatura mais ampla suaviza a interface, tornando-a mais amigável e menos institucional/rígida.
- **Componentes de Ação (Botões/Inputs):** Utilizam um raio de **8px**. Este valor mais contido transmite precisão e eficiência.
- **Status e Chips:** Utilizam o formato "Pill" (totalmente arredondado) para se destacarem como elementos interativos ou informativos distintos do conteúdo estático.

## Componentes

**Botões:**
- **Primário:** Fundo `#256B5A`, texto branco, raio de 8px.
- **Secundário:** Borda `#256B5A`, texto `#256B5A`, fundo transparente.
- **Ghost:** Sem borda, apenas texto, para ações de baixa prioridade.

**Inputs (Campos de Entrada):**
- Devem ter rótulos (labels) sempre visíveis acima do campo.
- Erros de validação utilizam a cor semântica `danger` tanto no texto quanto na borda do campo.

**Cartões (Cards):**
- Revestimento branco, raio de 16px, borda sutil de 1px.
- O cabeçalho do cartão deve usar `title-md` para títulos de secção.

**Listas de Casos:**
- Utilizar alternância de cores de linha (zebra striping) muito sutil ou separadores de 1px.
- IDs de casos devem ser renderizados em `data-sm` (JetBrains Mono).

**Chips de Status:**
- Fundo em alta transparência da cor semântica correspondente (ex: Verde Sucesso com 10% de opacidade) e texto em cor sólida para contraste acessível.

**Componentes Adicionais Sugeridos:**
- **Timeline de Histórico:** Para rastrear a evolução de cada caso de VBG cronologicamente.
- **Indicadores de Criticidade:** Badges visuais rápidos (Alto, Médio, Baixo) usando a paleta semântica.
- **Filtros Rápidos:** Barra lateral ou horizontal para segmentação por província ou tipo de violência.
