# AVDC v2.3 - Banco Administrativo

Esta versão separa o projeto em uma primeira etapa limpa:

- Sem GitHub.
- Sem OAuth.
- Sem repositório.
- Sem índice.
- Sem IA.

Foco exclusivo:

- Banco administrativo do AVDC.
- Login do admin.
- Troca da senha do admin.
- Cadastro de usuários.
- Código único do usuário.
- Token do usuário.
- Listar usuários.
- Ativar/inativar.
- Regenerar token.
- Excluir usuário.

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

## Banco

Por padrão o banco é SQLite:

```txt
data/avdc.sqlite
```

Em ambiente como Render, se usar SQLite, é necessário usar disco persistente.
Sem disco persistente, o arquivo do banco pode ser perdido em redeploy/restart.

## Próxima etapa

Depois que essa parte estiver validada, implementar:

1. Login do usuário comum.
2. Conexão GitHub.
3. Escolha do repositório.
4. Índice.
5. Busca.
6. IA como plugin opcional.
