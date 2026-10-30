# MisterBim

Aplicação Next.js com assistente técnico e ferramentas de dimensionamento.

## Desenvolvimento local

```bash
npm ci
npm run dev
```

Crie `.env.local` a partir de `.env.example` e preencha `OPENAI_API_KEY` para
habilitar o assistente. A variável `OPENAI_MODEL` é opcional e, se omitida,
usa `gpt-4.1-mini`. Nunca versione `.env.local`.

Verificações antes de publicar:

```bash
npm run typecheck
npm run build
```

## Deploy na Vercel

Ao importar o repositório do GitHub, configure **Root Directory** como
`misterbim`. A Vercel detectará Next.js e usará o build padrão. Cadastre
`OPENAI_API_KEY` nas variáveis de ambiente da Vercel para cada ambiente
necessário (Production, Preview e/ou Development). Não use `NEXT_PUBLIC_` para
essa chave.
