# BrasilTempo 🌤️

O oráculo do tempo brasileiro com personalidade. Em vez de um painel de números,
o **Zé do Tempo** responde perguntas da vida real ("vai chover amanhã?", "rola
praia no fds?", "preciso de casaco?") com um veredito grande, uma frase
engraçada e os dados de apoio.

Stack: **Next.js 14 (App Router) + TypeScript, SSR**, dados do **NOAA GFS**
(domínio público, uso comercial liberado), pronto para **Firebase App Hosting**.

---

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ajuste se quiser
npm run dev                  # http://localhost:3000
```

Outros scripts: `npm run build` (build de produção), `npm start` (servir o build),
`npm run typecheck`.

> Node 20 recomendado (ver `engines` no `package.json`).

---

## Como funciona

### Dados — NOAA GFS via ERDDAP
`src/lib/gfs.ts` busca o GFS no ERDDAP do PacIOOS (sem chave, CORS liberado) e
**normaliza** as variáveis cruas para o mesmo formato do Open-Meteo, de modo que
o motor de vereditos não precisa saber a origem dos dados.

O GFS não traz "código de tempo", "probabilidade de chuva" nem "índice UV" — então
derivamos (proxies documentados, ajustáveis):

| Campo | Derivado de |
|---|---|
| `weather_code` (sol/nuvem/chuva) | taxa de precipitação + umidade |
| `precipitation_probability_max` | taxa de precipitação + umidade |
| `uv_index_max` | radiação de onda curta (`dswrfsfc`) |
| `apparent_temperature` | temperatura + umidade + vento |
| nascer/pôr do sol | cálculo astronômico (`src/lib/sun.ts`) |

**Cache:** os dados são cacheados no servidor por 30 min (cache em memória +
`revalidate` do Next), então o ERDDAP **não** é chamado por visitante.

### Busca de cidades — `src/lib/geocode.ts` + `/api/geocode`
O campo de busca no topo encontra **qualquer cidade do mundo**. O front faz uma
chamada *debounced* para `/api/geocode`, que consulta o geocoder no servidor
(com cache). Ao escolher um resultado, o usuário vai para `/cidade/[slug]` com
as coordenadas na URL; o fuso horário (IANA → offset) é resolvido em
`src/lib/tz.ts`. O GFS é global, então a previsão funciona para qualquer lat/lon.

A página da cidade resolve o local em 3 níveis: (1) cidade curada (slug limpo,
ótimo SEO), (2) coordenadas vindas da busca, (3) *fallback* que re-geocoda o nome
do slug — assim links compartilhados funcionam mesmo sem parâmetros.

**Botão "minha localização" (🧭):** usa o `navigator.geolocation` do navegador
para pegar lat/lon, faz *reverse geocoding* em `/api/reverse` (BigDataCloud, sem
chave, nomes em pt-BR; GeoNames se `GEONAMES_USERNAME` estiver setado) e usa o
fuso do próprio navegador (que é o do usuário) — então a previsão sai certinha
pra onde a pessoa está.

> **Provider:** o padrão é o geocoding do Open-Meteo (sem chave, nomes em pt-BR).
> O *free tier* dele é **não-comercial** — mesma ressalva da API de tempo. Para
> uso comercial, crie uma conta grátis no **GeoNames** (CC-BY) e defina
> `GEONAMES_USERNAME`; o `geocode.ts` troca de provider sozinho. Alternativa:
> auto-hospedar Photon/Nominatim e apontar para lá.

### Vereditos — `src/lib/verdicts.ts`
Os 6 critérios do brief, portados verbatim e transparentes (chuva amanhã, praia
fds, casaco, churrasco, estender roupa, protetor). Fáceis de ajustar.

### Voz do Zé — `src/lib/phrases.ts`
Hoje: pool estático de frases (portado do protótipo) com escolha determinística
por dia. **`zePhrase()` é a única costura** onde, depois, você troca por frases
geradas em lote com Haiku — sem mexer em quem chama. **Nunca** chame o LLM por
visitante (destrói a margem do AdSense): gere em schedule e cacheie por
veredito+condição+cidade/dia.

### Caixa "pergunta o que quiser" — `src/app/api/pergunta/route.ts`
Hoje faz detecção de intenção por palavra-chave e responde com o veredito
correspondente. É o ponto onde entra o Haiku depois (extrair intenção + janela
de tempo + variáveis → ler o forecast já buscado → responder no tom do Zé).

---

## Estrutura

```
src/
  app/
    layout.tsx              # header, footer, metadata
    page.tsx                # home (oráculo) — SSR, São Paulo
    cidade/[slug]/page.tsx  # página por cidade (curada/buscada) — SSR
    api/pergunta/route.ts   # caixa de pergunta livre (seam de IA)
    api/geocode/route.ts    # busca de cidades (autocomplete)
    globals.css             # design tokens (cores, Plus Jakarta Sans)
  components/               # Header (busca), Logo, VerdictCard, FreeQuestionBox, seções
  lib/
    gfs.ts                  # NOAA GFS: fetch + normalização + cache
    verdicts.ts             # motor de vereditos + view de SEO
    geocode.ts              # geocoding mundial (pluggable) + Place→City
    tz.ts                   # fuso IANA → offset (Intl)
    phrases.ts              # POOLS do Zé + seam de IA
    sky.ts                  # mapa de código de tempo + derivação
    sun.ts                  # nascer/pôr do sol
    moon.ts                 # fase da lua
    cities.ts               # cidades curadas (SEO)
    types.ts
```

---

## Deploy — Firebase App Hosting

App Hosting roda o servidor SSR do Next pra você, com deploy a partir do Git.

```bash
npm install -g firebase-tools
firebase login
firebase init apphosting        # conecta o repositório GitHub
# faça push pra branch configurada → App Hosting builda e publica
```

`apphosting.yaml` já está configurado (CPU/memória/escala). Variáveis públicas
vão em `env:` com `value:`. Segredos (ex.: `ANTHROPIC_API_KEY` quando ligar a IA)
vão pelo Secret Manager:

```bash
firebase apphosting:secrets:set ANTHROPIC_API_KEY
```

e referencie no `apphosting.yaml` com `secret:` em vez de `value:`.

> Próximos passos sugeridos (do brief): ligar o Zé com IA (frases em lote +
> cache); camada de SEO por cidade/bairro; cache em Firestore; mais perguntas e
> polish de personalidade.
