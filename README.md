# AVDC v2.0 MVP

Backend real com Node.js, Express, SQLite e preparação para OAuth GitHub.

## Rodar local

```bash
npm install
cp .env.example .env
npm start
```

Acesse:

```txt
http://localhost:3000
```

Login inicial:

```txt
admin
admin123
```

## O que já faz

- Login admin.
- Troca senha admin.
- Cria usuário com nome, código único e token.
- Login usuário por código + token.
- Banco SQLite persistente em `data/avdc.sqlite`.
- GitHub OAuth preparado.
- Usuário conecta GitHub.
- Lista repositórios.
- Usuário seleciona repositório.
- Usuário configura índice.
- Busca simulada.

## Importante

Atualizar código não apaga banco.

O banco fica em:

```txt
data/avdc.sqlite
```

Não coloque `data/avdc.sqlite` no GitHub se tiver tokens reais.

## Render

Configurar variáveis de ambiente:

```txt
SESSION_SECRET
ADMIN_USER
ADMIN_PASSWORD
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
GITHUB_CALLBACK_URL
```

Callback no Render:

```txt
https://SEU-APP.onrender.com/auth/github/callback
```
