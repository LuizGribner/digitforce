@AGENTS.md

# Digit Force: site institucional

Site one-page da Digit Force, empresa brasileira de segurança eletrônica, controle de acesso e IA para hotelaria
(interfonia digital 2 fios, emergência para elevadores e o assistente de IA Athpace). Público B2B: integradores,
construtoras e hotéis.

## Stack (não trocar)

- Next.js App Router + TypeScript, export estático (`next.config.ts`: `output: "export"`, `images.unoptimized`).
- Tailwind v4 + shadcn/ui (Radix, preset Nova).
- `src/components/ui/`: orbiting-circles, number-ticker, border-beam, magic-card, shimmer-button (Magic UI), spotlight e
  background-beams (Aceternity). Não reescrever esses arquivos: se uma prop não bater, ajustar o uso no `home-page.tsx`.
- three, @react-three/fiber, @react-three/drei, motion. Cenas 3D ficam em `src/components/three/` e entram no
  `home-page.tsx` via `next/dynamic` com `ssr: false`. Não criar outros `<Canvas>`: usar `<View>` no canvas único.
- Não instalar bibliotecas novas sem perguntar.

## Identidade visual

- Cores: `#00003A` (azul profundo, fundo), `#5749A5` (roxo, destaque), `#333333` (grafite), `#F2F2F2` (branco suave).
  Tint para texto sobre o navy: `#A89CF0`.
- Fonte: Montserrat (via `next/font` no `layout.tsx`).
- Tokens e overrides do tema em `src/app/digitforce.css` (importado depois do `globals.css`). Não editar o `globals.css`.
- Visual maduro, técnico e premium, sem exagero "cyber".
- Referências: site "Gems" (dark, títulos com segunda linha em gradiente `.df-gradient-text`, órbitas de ícones, anel
  com logo, CTA em card); hero com feixe de luz sobre objeto 3D (CZ Cyber Security); cards de vidro com objetos 3D
  escapando da borda (Profico Academy).

## Idiomas (i18n)

- en (padrão) na raiz `/`, pt-BR em `/pt-br/`, pt-PT em `/pt-pt/`. Rota única `src/app/[[...locale]]/` (layout raiz
  com `<html lang>`, `generateMetadata` com hreflang/x-default e `generateStaticParams`; `dynamicParams = false`).
  `trailingSlash: true` (cada idioma vira pasta com index.html). Sem middleware.
- Dicionários em `src/i18n/{en,pt-BR,pt-PT}.ts`: `en.ts` define o formato (`Dictionary`); os outros são tipados com
  ele, então chave faltando quebra o build. Nos componentes: `const { t, dict, locale } = useI18n()`; `t("a.b")` para
  textos simples (chaves tipadas), `dict` para listas e objetos por id. O servidor passa só o dicionário do idioma.
- Todo texto visível, aria-label, alt e sr-only vem do dicionário. Nomes de marca (Digit Force, Athpace) não se
  traduzem. pt-PT é português europeu (ecrã, telemóvel, equipa, contacto, controlo, receção...).
- Seletor (`components/language-switcher.tsx`) no header e no menu mobile; troca por navegação completa guardando a
  seção visível (`i18n/navigation.ts`, sessionStorage) e a escolha (localStorage `df-locale`). Na raiz, navegador em
  português e sem escolha salva: aviso `components/locale-suggestion.tsx` (nunca redireciona).
- Palavra do rasgo: FORCE (en) / FORÇA (pt). O `<text>` usa `textLength`, então qualquer palavra ocupa a mesma caixa e
  a geometria de `tear-geometry.ts` vale para todas.
- Legendas do vídeo: `public/assets/video/subtitles/{en,pt-PT}.vtt`. O `page.tsx` só cria o `<track>` se o arquivo
  existir no build (ainda não existem: TODO).

## Estrutura

- `src/components/home-page.tsx` (montado por `src/app/[[...locale]]/page.tsx`): as seções (header, hero com globo
  3D, rasgo "FORCE"/"FORÇA" (#sobre), números e pilares, órbita de integrações, produtos, Athpace, manifesto com anel,
  CTA, rodapé).
- Hero (`src/components/hero/hero.tsx` + `src/components/three/hero-globe.tsx`): globo-circuito procedural com um
  chip andando no topo. Física em `src/components/hero-globe/globe-motion.ts` (portada da referência
  orbit-delivery-hero: mola + amortecimento no arrasto, roaming após 3,5 s, chip buscando o topo visível com mola,
  passada ligada à velocidade), sub-passos de 1/120 s. Textura de placa de circuito gerada em canvas no mount
  (`circuit-texture.ts`, seed fixa); o rastro do chip acende as trilhas via `onBeforeCompile` no emissive. Estado
  controlado pelo DOM (`GlobeSim`: auto/reduced/active) e `Motion` vivem em refs, lidos no useFrame. Lenis é pausado
  durante o arrasto (`getLenis()` do provider). Mutação por frame fica em funções do `globe-motion.ts` (o lint do
  React Compiler não aceita atribuir campos de props/useMemo dentro de componentes).
- `src/components/three/`: 3D com um único `<Canvas>` fixo (`scene-canvas.tsx`, `eventSource` no body, z-index 5:
  acima dos fundos, abaixo do conteúdo z-10+). dpr adaptativo por FPS (`adaptive-resolution.tsx`; máx. 2 em desktop
  forte, 1.25 em mobile/fraco, `hero-globe/render-quality.ts`). Cada seção renderiza um `<View>` do drei:
  `hero-globe.tsx`, `integrations-mark.tsx`, `manifesto-ring.tsx`, `product-model.tsx`, `tear-mark.tsx`.
  Regra: o "df" nunca gira mais que ±25° em Y (acima disso aparece espelhado).
- Armadilha do `useLoader` (R3F 9 + three 0.186): o cache compara loaders com `is.equ`, que acha SVGLoader e
  TextureLoader iguais (props estáticas herdadas de Loader). A mesma URL em dois loaders divide o cache e um recebe o
  objeto do outro. Cada arquivo deve ter uma URL por loader (textura do logo usa `?as=texture`). O "df" é o `df-mark.tsx` (geometria
  criada uma vez e reaproveitada); luzes compartilhadas em `studio-lights.tsx`; pointer da janela/do card em
  `pointer.ts` (dentro de um View o `state.pointer` é do portal, não da janela).
- Quando o canvas existe: sempre que há WebGL (`use-webgl.ts`), inclusive no mobile e em reduced motion, porque o
  globo do hero roda nesses casos. Falha em runtime cai no `CanvasBoundary` e a página volta aos fallbacks.
- As demais cenas usam `useEnable3D()` (>= 768px e sem reduced motion) combinado com WebGL; fora disso o `home-page.tsx`
  mostra as imagens estáticas (e no HTML do export). Elementos que precisem ficar acima do 3D usam z-10+.
- O canvas usa `flat` (NoToneMapping): o ACES acinzentava a lavanda e o roxo da marca. O "df" tem as variantes
  `perola` (padrão, hero e manifesto) e `roxo` (órbita).
- O div de um `<View>` só marca o retângulo; os pixels são do canvas fixo. CSS no div (mask-image, overflow) não
  afeta o 3D. Para não aparecer borda reta de recorte, o objeto/feixe precisa terminar dentro do View.
- `public/assets/logo/`: SVGs extraídos do .ai original (`df-monogram-branco.svg`, `df-monogram-roxo.svg`,
  `digitforce-horizontal-dark-bg.svg`, `digitforce-horizontal-branco.svg`). Os SVGs têm um clipPath herdado do
  Illustrator; usar só os paths de cor.
- `public/assets/produtos/{interfone,elevador}/*.webp`: fotos de produto.
- `public/assets/video/`: `athpace-1080.mp4` e `athpace-720.mp4` (H.264, CRF 27/28, +faststart) e
  `athpace-poster.webp` (frame de 67,75 s, sem legenda). O original fica em `raw/athpace.mp4` e os frames de
  referência do speaker para modelagem 3D em `raw/frames/`; `raw/` está no .gitignore e não vai para o public.
- `src/components/site-header.tsx`: header fixo (pílula `.glass-strong` sempre visível: 80% da largura da tela no topo, compacta ao rolar), link ativo
  por IntersectionObserver, menu mobile. `section[id]` tem `scroll-margin-top` no digitforce.css.
- `src/components/athpace-video.tsx`: player com `preload="none"` (só o poster carrega até o clique).

## Animação: GSAP + Lenis

- GSAP (ScrollTrigger, DrawSVGPlugin, CustomEase, SplitText) + `@gsap/react` (`useGSAP`). Plugins e CustomEases
  (`dfTear`, `dfDraw`, `dfSoft`) registrados uma vez em `src/lib/gsap.ts`; importar `gsap` sempre de lá.
  Breakpoints e reduced motion via `gsap.matchMedia()`. Motion (framer) não entra nas seções feitas com GSAP.
- Lenis (smooth scroll) no site inteiro: provider em `src/components/providers/smooth-scroll.tsx`, aplicado no
  layout. Roda no `gsap.ticker` com prioridade e chama `ScrollTrigger.update` no scroll; `anchors: true` (respeita
  o `scroll-margin-top`). Desligado com prefers-reduced-motion. `ScrollTrigger.refresh()` após fontes e `load`.
- O canvas 3D usa `frameloop="never"` e `advance()` no mesmo ticker, depois do Lenis: os Views leem o scroll do
  próprio frame (sem atraso de um frame em relação ao DOM).
- `gsap.quickSetter` não aceita aliases que viram várias propriedades ("scale" -> "scaleX,scaleY", "autoAlpha"):
  cai no setAttribute e derruba a página. Escala uniforme = dois setters (`scaleSetter` em integrations-orbit.tsx).
- Cada seção animada (hero, rasgo, órbita, manifesto) fica dentro de um `SectionBoundary`
  (`src/components/section-boundary.tsx`): se quebrar, mostra a versão estática
  (`sections/static-fallbacks.tsx`, `<Manifesto enable3D={false} />`) em vez de derrubar a página.
- Regra: filtros SVG/CSS só em elementos estáticos. Nunca animar atributos de filtro; animar só transform e opacity.
  Geometria (paths, clip-paths, regiões de filtro) pode ser recalculada no resize, nunca por frame.
- Seção do rasgo (#sobre, `src/components/tear/`): caminho procedural determinístico em `tear-geometry.ts` (fonte
  única para a linha, os dois clip-paths e as bordas). Usa duas camadas `position: sticky` em vez de pin do
  ScrollTrigger, porque o "df" 3D (canvas fixo, z 5) precisa ficar entre o fundo (z 1) e o papel (z 10); o pin
  criaria um único stacking context. `tear-state.ts` liga a timeline ao useFrame do `tear-mark.tsx`.
- Pilares em `src/components/sections/proof-strip.tsx` (faixa depois do rasgo, entrada com ScrollTrigger.batch).
  Os números (dados do Athpace) ficam em `sections/athpace-stats.tsx`, abaixo do vídeo na seção #athpace.
- Integrações (#solucoes, `sections/integrations-orbit.tsx`): 8 cards com foto que saem de uma pilha para uma órbita
  elíptica guiada pelo scroll (mecânica portada da referência CinematicOrbitHero para GSAP: inOutCubic, escala e
  z-index pela profundidade, giro após 95%, parallax por ponteiro, hover/foco traz o card à frente e desenha a linha
  de luz até o "df"). Zonas: texto no topo (12vh) e nenhum card acima do fim do subtítulo + 32px; raios, centro e
  escala calculados no resize por `sections/orbit-layout.ts` (função pura, com checagem de sobreposição <= 15%).
  Camadas sticky: fundo z 4 < canvas z 5 ("df") < cards z 8 < texto z 10. Mobile: 6 cards, sem parallax.
- Classes em `digitforce.css`, dentro de `@layer components` (para utilitários do Tailwind vencerem):
  `.glass` (padrão), `.glass-strong` (header, painéis), `.glass-subtle` (cards grandes). O fundo fica em
  `--glass-bg`; componentes com background inline (MagicCard) usam `[background:var(--glass-bg)]!`.
- Refração: filtro SVG `#df-glass-refraction` (feTurbulence + feDisplacementMap) em `components/glass-filter.tsx`,
  aplicado via `backdrop-filter: url(...)` só com `html.glass-refraction`. Essa classe é adicionada por JS apenas no
  Chromium (`navigator.userAgentData.brands`). Não dá para detectar com `@supports`: o Safari aceita a sintaxe mas
  descarta o filtro inteiro (perde até o blur). Safari/Firefox ficam no blur normal. `.glass-subtle` não recebe
  refração (custo alto em áreas grandes).
- Sem backdrop-filter o vidro fica mais opaco (`@supports not`), para manter o contraste.
- As manchas de luz (`.df-ambient` no layout) ficam em `z-index: -1`; por isso o fundo navy está no `html` e o `body`
  é transparente. Deriva desligada com prefers-reduced-motion.
- Contraste: `--muted-foreground` é #B9B8D9 (AA sobre `.glass`/`.glass-strong` mesmo com o feixe do hero atrás).
  `backdrop-filter` cria stacking context: texto dentro de um card de vidro não sobe acima do canvas 3D (z-5).

## Mobile / toque

- Canvas fixo + Views só com ponteiro fino (`useEnable3D` inclui `pointer: fine`). No toque a rolagem roda fora da
  thread do JS e o que é desenhado num canvas fixo fica um frame atrás da página ("pula" ao rolar). Lá o canvas fixo
  não é montado, as seções usam os fallbacks estáticos e o globo do hero usa `HeroGlobeCanvas` (canvas embutido na
  área do globo, rola junto com a página; mesma cena, dimensionada por `state.size`).
- Memória no celular ("This page couldn't load" = aba derrubada por falta de memória): o Spotlight da Aceternity
  (SVG com blur de raio 151) só aparece com mouse; no toque entra `.hero-spotlight-css` (gradiente). Metades do
  rasgo com margens menores no toque. Cards (órbita e fallbacks de produto) usam fotos `-sm.webp` (640px); as
  originais ficam para as texturas 3D. Evitar filtros SVG/blur grandes e imagens decodificadas acima do necessário.
- Globo do hero: `touch-action: pan-y` (arrastar para os lados gira, vertical rola a página; o navegador manda
  pointercancel ao assumir o scroll). No toque o Lenis não é pausado e o arrasto é só horizontal.
- `ScrollTrigger.config({ ignoreMobileResize: true })` (barra de endereço não dispara refresh); alturas em svh.
- Rasgo e órbita no toque (`pointer: coarse`): seções fixadas mais curtas (220svh / 200svh), scrub 0.4 e snap
  direcional em [0, 1]: uma passada de dedo dentro da seção completa a abertura (ou volta, se o gesto for para cima).
- Dispositivos de toque/fracos: sem refração do vidro, cards da órbita sem backdrop-filter (vidro mais opaco),
  textura do globo em meia resolução e esfera com menos segmentos (`getRenderQuality()`).
- Órbita: no toque só o clique alterna a frase do card (o foco chega antes e fecharia no mesmo toque); tocar fora
  fecha. Menu mobile fecha ao tocar fora. `touch-action: manipulation` no html e `:active` visível sem hover.

## Pendências

- `WHATSAPP` e `EMAIL` no topo do `home-page.tsx` e os números em `athpace-stats.tsx` são placeholders com TODO.
- Frases curtas dos cards de integração (`integrations-orbit.tsx`) têm TODO de revisão com o cliente.
- As fotos `app-tela.webp` e `terminal-monitoramento.webp` mostram interface em chinês (como o gateway, excluído).
  Manter os TODOs até o cliente confirmar.

## Verificação

`npm run lint` e `npm run build` (o export estático precisa passar).
