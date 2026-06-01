# Fluxos de API

## Auth

- `POST /auth/register`: cria usuario e retorna tokens.
- `POST /auth/login`: autentica por email e senha.
- `POST /auth/refresh`: rotaciona refresh token.
- `POST /auth/logout`: remove hash do refresh token.
- `GET /auth/me`: retorna usuario autenticado.

## Marketplace

- `GET /terrains`: lista terrenos com busca, filtros e paginacao.
- `POST /terrains`: cria terreno para admin ou proprietario.
- `GET /terrains/:id`: detalhe com imagens e projetos compativeis.
- `GET /projects`: lista projetos com filtros.
- `POST /projects`: cria projeto para arquitetos.
- `POST /compatibility`: vincula projeto e terreno.

## Simulacao e checkout

- `POST /simulations`: calcula terreno, projeto, obra estimada e parcelas.
- `POST /payments/orders`: cria pedido.
- `POST /payments/checkout`: cria sessao de pagamento no provedor.
- `POST /payments/webhooks/:provider`: recebe eventos externos.

## Painel

- `GET /admin/metrics`: indicadores gerais.
- `GET /architects/me/stats`: vendas, projetos e conversao.
- `GET /notifications`: notificacoes do usuario.
