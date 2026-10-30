# MisterBim

Criação da Bia IA especialista.

Aplicação Next.js localizada em [`misterbim/`](./misterbim/).

## Executar localmente

```powershell
cd .\misterbim
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Preencha `OPENAI_API_KEY` no arquivo `misterbim/.env.local` antes de usar o
assistente. Nunca envie esse arquivo ao GitHub.

## GitHub

O workflow em `.github/workflows/ci.yml` executa instalação, verificação de
tipos e build a cada push e pull request. Ele usa `misterbim/` como diretório
de trabalho.

## Vercel

1. Importe este repositório na Vercel.
2. Em **Root Directory**, escolha `misterbim`.
3. Use os comandos padrão detectados para Next.js (`npm ci` e `npm run build`).
4. Em **Settings → Environment Variables**, configure `OPENAI_API_KEY` nos
   ambientes desejados. `OPENAI_MODEL` é opcional; o padrão é `gpt-4.1-mini`.
5. Faça um deploy e, depois, publique novas versões enviando commits para o
   GitHub.

Não é necessário adicionar a chave `OPENAI_API_KEY` ao GitHub nem usar o prefixo
`NEXT_PUBLIC_`: a chave é consumida somente pelas rotas de servidor.
