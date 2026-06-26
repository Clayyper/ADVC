# AVDC v2.5 - PostgreSQL Persistente

Esta versão troca SQLite por PostgreSQL usando `DATABASE_URL`.

## Objetivo

Impedir que os usuários sumam quando:

- reiniciar o serviço no Render;
- fazer novo deploy;
- atualizar código.

## Requisito no Render

Crie um PostgreSQL no Render e coloque no Web Service:

```env
DATABASE_URL=postgres://...
SESSION_SECRET=uma-chave-grande
ADMIN_USER=admin
ADMIN_PASSWORD=admin123
```

## Rodar local

```bash
npm install
cp .env.example .env
npm start
```

Para rodar local, você precisa de um PostgreSQL acessível em `DATABASE_URL`.

## Login inicial

```txt
admin
admin123
```

## Fluxo validado

1. Admin faz login.
2. Admin cria usuário.
3. Usuário loga com código + token.
4. Novo deploy não apaga usuários, desde que `DATABASE_URL` esteja apontando para o PostgreSQL persistente.

## Próxima etapa

Depois de validar persistência:

- Conexão GitHub por usuário.
- Escolha de repositório.
- Índice.
- Busca.
