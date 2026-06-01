# Fluxo completo do projeto

Este documento descreve o fluxo principal do marketplace.

A ideia do sistema e conectar:

- cliente que procura terreno;
- cliente que procura projeto arquitetonico;
- cliente que quer pacote completo: terreno + projeto + obra;
- arquiteto que cadastra projetos;
- admin que aprova usuarios, projetos, terrenos e acompanha fechamentos.

## Logins de teste

Depois de rodar o seed, usar:

```txt
Admin
Email: admin@anselmo.dev
Senha: Admin@123456
URL:   http://localhost:3000/admin

Arquiteto aprovado
Email: arquiteto@anselmo.dev
Senha: Arq@123456
URL:   http://localhost:3000/painel-arquiteto

Arquiteto pendente
Email: pendente@anselmo.dev
Senha: Arq@123456
URL:   http://localhost:3000/painel-arquiteto

Cliente
Email: cliente@anselmo.dev
Senha: Cliente@123456
URL:   http://localhost:3000/dashboard
```

## Perfis do sistema

### Cliente

O cliente pode:

- navegar por terrenos;
- navegar por projetos;
- favoritar terrenos e projetos;
- montar pacote terreno + projeto + obra;
- ver uma pre-analise de simulacao;
- comprar projeto pela plataforma;
- solicitar fechamento de terreno ou pacote completo com atendimento.

### Arquiteto

O arquiteto pode:

- criar conta;
- aguardar aprovacao;
- acessar painel do arquiteto;
- cadastrar projetos;
- informar medidas do projeto;
- informar preco do projeto;
- informar custo estimado de obra;
- enviar imagens, renders e plantas;
- acompanhar projetos publicados.

### Admin

O admin pode:

- aprovar ou recusar arquiteto;
- acompanhar metricas;
- revisar cadastros;
- acompanhar intencoes de compra e fechamento;
- organizar curadoria de terrenos e projetos.

## Fluxo do arquiteto

1. Arquiteto cria conta.
2. Sistema cria perfil com status `PENDING_REVIEW`.
3. Admin acessa `/admin`.
4. Admin aprova o arquiteto.
5. Arquiteto entra em `/painel-arquiteto`.
6. Arquiteto cadastra projeto.

Campos importantes do projeto:

```txt
titulo
descricao
estilo
largura minima do terreno
profundidade minima do terreno
area construida
quartos
banheiros
suites
vagas
pavimentos
preco do projeto
custo estimado de obra
imagens
render
planta
status
```

Exemplo:

```txt
Projeto Casa Linear
Medida ideal: terreno 5m x 20m
Area construida: 85 m2
Preco do projeto: R$ 8.000
Custo estimado da obra: R$ 260.000
```

Outro exemplo:

```txt
Projeto Casa Patio
Medida ideal: terreno 10m x 25m
Area construida: 180 m2
Preco do projeto: R$ 18.000
Custo estimado da obra: R$ 620.000
```

## Fluxo de cadastro por medida

Cada projeto precisa ter medidas minimas para encaixe.

Exemplo:

```txt
Projeto A
Largura minima: 5m
Profundidade minima: 20m

Projeto B
Largura minima: 8m
Profundidade minima: 20m

Projeto C
Largura minima: 10m
Profundidade minima: 25m
```

Quando um terreno e cadastrado, ele tambem precisa ter medidas:

```txt
Terreno 1
Largura/frente: 5m
Profundidade: 20m

Terreno 2
Largura/frente: 10m
Profundidade: 30m
```

Assim, quando o cliente abrir um terreno 5m x 20m, o sistema deve mostrar projetos que cabem nessa medida.

Regra simples:

```txt
projeto.largura_minima <= terreno.frente
projeto.profundidade_minima <= terreno.profundidade
```

Se bater, o projeto aparece como compativel.

## Fluxo do cliente escolhendo terreno

1. Cliente entra em `/terrenos`.
2. Cliente escolhe um terreno.
3. Sistema abre a pagina do terreno.
4. Sistema mostra dados do terreno:

```txt
titulo
cidade
estado
metragem
frente
profundidade
preco
fotos
descricao
```

5. Sistema busca projetos compativeis pela medida do terreno.
6. Se o terreno for 5m x 20m, aparecem projetos cadastrados para 5m x 20m ou menores.
7. Cliente escolhe um projeto compativel.
8. Sistema mostra uma apresentacao animada do projeto naquele terreno.

## Animacao do projeto no terreno

A animacao deve servir para o cliente entender visualmente o encaixe.

Exemplo de comportamento:

1. Cliente esta vendo um terreno 5m x 20m.
2. Sistema mostra um card: `Projetos que cabem neste terreno`.
3. Cliente clica em um projeto.
4. Abre uma animacao simples:

```txt
terreno aparece em planta baixa
medidas aparecem na tela
projeto entra por cima do lote
area construida fica destacada
recuos e areas livres aparecem
valor do projeto aparece
custo estimado da obra aparece
```

Depois da animacao, o cliente ve o resumo:

```txt
Terreno: R$ 120.000
Projeto: R$ 8.000
Obra estimada: R$ 260.000
Total estimado do pacote: R$ 388.000
```

Importante: a animacao e apresentacao comercial. Ela nao substitui aprovacao tecnica, prefeitura, engenheiro, arquiteto responsavel ou financiamento.

## Fluxo terreno + projeto + obra

Este e o fluxo principal do marketplace.

1. Cliente escolhe terreno.
2. Sistema mostra projetos compativeis por medida.
3. Cliente escolhe projeto.
4. Sistema apresenta animacao do projeto no terreno.
5. Sistema monta o pacote:

```txt
valor do terreno
valor do projeto
custo estimado da obra
documentacao estimada
reserva estimada
```

6. Cliente clica em `Simular pacote`.
7. Sistema leva para `/simulacao`.
8. Simulacao mostra pre-analise comercial baseada na CAIXA.
9. Sistema deixa claro que a simulacao oficial deve ser feita na CAIXA.
10. Cliente clica em `Falar com atendente` ou `Iniciar fechamento`.
11. Atendimento confere documentos e encaminha para simulacao oficial.
12. Fechamento so avanca depois de validacao real.

## Fluxo comprando somente terreno

Se o cliente quiser somente o terreno:

1. Cliente abre `/terrenos`.
2. Cliente escolhe terreno.
3. Cliente clica em `Quero este terreno`.
4. Sistema leva para fechamento.
5. Fechamento vira atendimento/comercial.

Neste caso, o terreno nao precisa ser pago diretamente pela plataforma.

O sistema deve criar uma intencao de compra:

```txt
tipo: TERRAIN_ONLY
cliente
terreno
valor do terreno
status: aguardando atendimento
```

Depois o atendente continua:

- conferencia de dados;
- documentacao;
- negociacao;
- proposta;
- contrato;
- financiamento, se existir;
- assinatura.

## Fluxo comprando somente projeto

Se o cliente quiser somente o projeto arquitetonico:

1. Cliente abre `/projetos`.
2. Cliente escolhe projeto.
3. Cliente ve detalhes:

```txt
medida minima do terreno
area construida
quartos
banheiros
preco do projeto
custo estimado de obra
imagens
plantas
arquiteto
```

4. Cliente clica em `Comprar projeto`.
5. Sistema leva para checkout.
6. Cliente paga pela plataforma.
7. Pagamento confirmado.
8. Sistema libera acesso/entrega do projeto conforme regra comercial.

Regra importante:

```txt
Somente projeto pode ser pago direto pela plataforma.
```

Terreno e pacote completo devem ir para fechamento assistido.

## Fluxo de fechamento

Existem tres tipos de fechamento:

```txt
PROJECT_ONLY
TERRAIN_ONLY
PACKAGE
```

### PROJECT_ONLY

Pode pagar pela plataforma.

Fluxo:

```txt
projeto escolhido
checkout
pagamento
confirmacao
liberacao do projeto
notificacao para arquiteto
repasse/split preparado
```

### TERRAIN_ONLY

Nao paga direto pela plataforma.

Fluxo:

```txt
terreno escolhido
intencao de compra
atendimento
documentacao
proposta
contrato
fechamento externo ou assistido
```

### PACKAGE

Nao paga direto pela plataforma no primeiro momento.

Fluxo:

```txt
terreno escolhido
projeto compativel escolhido
obra estimada
pre-analise de simulacao
atendimento
simulacao oficial CAIXA
documentacao
proposta
contrato
fechamento assistido
```

O pacote pode gerar venda do projeto depois, mas o fechamento completo depende de validacao real do terreno, obra e financiamento.

## Fluxo visual resumido

```txt
Cliente
  |
  |-- escolhe terreno
  |     |
  |     |-- sistema busca projetos compativeis pela medida
  |     |-- mostra animacao do projeto no terreno
  |     |-- mostra terreno + projeto + obra
  |     |-- vai para simulacao
  |     |-- vai para fechamento assistido
  |
  |-- escolhe somente terreno
  |     |
  |     |-- vai direto para fechamento assistido
  |
  |-- escolhe somente projeto
        |
        |-- vai para checkout
        |-- paga pela plataforma
```

## Compatibilidade entre terreno e projeto

A compatibilidade deve ser salva para acelerar a experiencia.

Exemplo:

```txt
terrain_id
project_id
status
score
notes
```

Status possiveis:

```txt
SUGGESTED
APPROVED
REJECTED
```

Regra:

- `SUGGESTED`: sistema sugeriu automaticamente por medidas.
- `APPROVED`: admin/arquiteto confirmou que o projeto cabe.
- `REJECTED`: projeto nao deve aparecer para aquele terreno.

## Melhorias importantes para implementar

Para este fluxo ficar completo, o projeto precisa evoluir nestes pontos:

1. Adicionar campos de largura e profundidade minima no cadastro de projeto.
2. Garantir que terreno tenha frente e profundidade preenchidas.
3. Criar busca automatica de projetos compativeis por medida.
4. Criar animacao simples de encaixe do projeto no lote.
5. Criar tipo de pedido: `PROJECT_ONLY`, `TERRAIN_ONLY`, `PACKAGE`.
6. Permitir pagamento pela plataforma apenas para `PROJECT_ONLY`.
7. Criar fechamento assistido para terreno e pacote.
8. Permitir anexar resultado da simulacao oficial CAIXA no atendimento.
9. Criar painel do admin para acompanhar leads e fechamentos.
10. Criar painel do arquiteto para ver vendas de projetos.

## Regra central

O sistema vende melhor quando combina tres coisas:

- terreno certo;
- projeto que cabe no terreno;
- caminho claro para simulacao e fechamento.

O projeto arquitetonico pode ser vendido direto pela plataforma.

Terreno e pacote completo precisam de atendimento, documentos e validacao externa antes do fechamento final.
