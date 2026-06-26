# AVDC v2.4 - Banco Administrativo + Login do Usuário

Esta versão valida a segunda etapa do projeto:

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


## Novo na v2.4

Agora o usuário comum também consegue logar usando:

```txt
Código do usuário
Token gerado pelo admin
```

Fluxo:

```txt
Admin cria usuário
Admin copia token
Usuário entra na aba "Usuário comum"
Usuário informa código + token
Sistema valida no banco
Usuário entra no painel próprio
```

Ainda não há GitHub nesta versão.
