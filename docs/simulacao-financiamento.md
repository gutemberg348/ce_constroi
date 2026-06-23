# Simulacao de financiamento habitacional

Este documento explica a logica atual usada na tela `/simulacao`.

A simulacao e uma triagem comercial. Ela ajuda o cliente e o atendimento a entenderem se o pacote parece caber na renda, mas nao substitui a simulacao oficial da CAIXA nem representa aprovacao bancaria.

## O que a tela responde

A tela deve responder de forma simples:

1. Qual e o valor do pacote escolhido.
2. Qual e o valor estimado do financiamento.
3. Quanto falta de entrada, se faltar.
4. Qual e a parcela estimada para o valor financiado.
5. Se o pacote parece compativel para seguir ao atendimento.
6. Qual ajuste principal precisa ser feito quando nao couber.

## Entradas usadas

O simulador usa:

- renda bruta mensal principal;
- outras rendas, quando informadas;
- renda do comprador adicional, quando houver composicao;
- dividas mensais e financiamento atual;
- data de nascimento;
- cidade e estado;
- valor do terreno;
- valor do projeto;
- custo estimado da obra;
- entrada em dinheiro;
- FGTS, quando marcado para uso;
- restricoes e perfil basico.

## Valor do pacote

O valor analisado depende da escolha:

```text
So terreno = valor do terreno
Terreno + projeto = valor do terreno + valor do projeto
Terreno + projeto + obra = valor do terreno + valor do projeto + custo da obra
Valor manual = valor informado pelo cliente
```

No codigo, esse valor e `desiredPackageValue`.

## Renda considerada

```text
totalIncome =
  renda bruta mensal
  + renda informal, se marcada
  + renda do comprador adicional, se marcada
```

## Limite interno de parcela

O sistema calcula uma margem interna para saber se o pacote cabe. Essa margem nao aparece como card principal para o cliente.

```text
parcela maxima interna = renda considerada x 30% - dividas mensais
```

No codigo:

```text
maxInstallment = max(totalIncome x 0.30 - debtPressure, 0)
```

Essa parcela maxima e apenas limite de enquadramento. A parcela exibida ao cliente nao deve ser simplesmente esse teto.

## Prazo por idade

O prazo base e limitado a 420 meses.

Tambem existe limite pela idade:

```text
idade ao final <= 80 anos e 6 meses
```

No codigo:

```text
MAX_TERM_MONTHS = 420
MAX_AGE_MONTHS_AT_END = 80 * 12 + 6
termMonths = min(420, meses restantes ate 80 anos e 6 meses)
```

Para o resultado ser compativel:

- a data de nascimento precisa estar informada;
- o cliente precisa ter pelo menos 18 anos;
- o prazo calculado precisa ser maior que zero.

## Taxa estimada

O sistema escolhe uma taxa nominal anual estimada por faixa de renda e regiao.

As faixas atuais do codigo seguem esta referencia operacional:

```text
ate R$ 3.200       -> MCMV Faixa 1
R$ 3.200,01-5.000 -> MCMV Faixa 2
R$ 5.000,01-9.600 -> MCMV Faixa 3
R$ 9.600,01-13.000 -> MCMV Faixa 4 / Classe Media
acima de R$ 13.000 -> SBPE/SFH ou Pro-Cotista estimado
```

Observacoes:

- estados do Norte e Nordeste podem ter taxa menor em algumas faixas;
- uso de FGTS pode reduzir taxa em alguns cenarios;
- a taxa final depende da instituicao financeira, perfil, relacionamento, avaliacao e modalidade.

## Sistema de amortizacao usado

A simulacao atual usa `PRICE` como referencia de parcela estimada.

```text
financingSystem = PRICE
```

Isso e uma estimativa comercial. A CAIXA pode apresentar sistemas e condicoes diferentes na simulacao oficial.

## Conversao de taxa

A taxa nominal anual e convertida para taxa mensal simples:

```text
monthlyRate = nominalAnnualRate / 100 / 12
```

A taxa efetiva anual e calculada apenas para registro interno:

```text
effectiveAnnualRate = ((1 + monthlyRate) ^ 12 - 1) x 100
```

## Capacidade de financiamento pela renda

A capacidade pela renda e calculada pela formula da tabela PRICE, usando a parcela maxima interna, taxa mensal e prazo.

```text
maxCreditByIncome =
  valor presente da parcela maxima interna no prazo calculado
```

No codigo:

```text
maxCreditByIncome = principalByPaymentCapacity(
  maxInstallment,
  monthlyRate,
  termMonths,
  "PRICE",
  paymentFeeRate
)
```

Esse valor nao e mostrado como card principal. Ele serve para saber se falta entrada ou se a renda nao comporta o pacote.

## Cota de financiamento

A regra operacional da plataforma considera cota maxima de 80%.

```text
financiamento por cota = valor do pacote x 80%
entrada minima por cota = valor do pacote x 20%
```

No codigo:

```text
maxCreditByQuota = desiredPackageValue x 0.80
minimumEntryByQuota = desiredPackageValue x 0.20
```

## Entrada necessaria

A entrada necessaria e o maior valor entre:

- 20% do pacote;
- diferenca entre o pacote e o financiamento permitido pela renda.

```text
minimumEntryByIncome = max(valor do pacote - maxCreditByIncome, 0)
minimumRequiredEntry = max(minimumEntryByQuota, minimumEntryByIncome)
```

## Entrada informada

A entrada informada soma dinheiro e FGTS quando o cliente marcou uso do FGTS.

```text
availableEntry = entrada em dinheiro + FGTS considerado
```

## Entrada que falta

O card principal mostra somente o que falta, nao a entrada tecnica total.

```text
entryShortfall = max(minimumRequiredEntry - availableEntry, 0)
```

Se nao falta entrada, o card mostra `R$ 0`.

## Valor financiado usado para parcela

A parcela estimada deve ser calculada pelo valor financiado do cenario, e nao pela parcela maxima do cliente.

O valor financiado do cenario usa a maior entrada entre:

- entrada informada pelo cliente;
- entrada minima necessaria calculada pelo sistema.

```text
entryForScenario = max(availableEntry, minimumRequiredEntry)
financedNeeded = desiredPackageValue - entryForScenario
```

Na tela, esse valor aparece como `Valor do financiamento`.

Importante: se a renda exigir uma entrada maior que 20%, essa diferenca aparece como `entrada que falta`. A parcela estimada continua sendo calculada pelo valor financiado do cenario, sem forcar a parcela para bater no teto da renda.

## Parcela estimada

A parcela estimada usa tabela PRICE.

```text
factor = (1 + monthlyRate) ^ termMonths
basePayment = financedNeeded * monthlyRate * factor / (factor - 1)
estimatedInstallment = basePayment x (1 + paymentFeeRate)
```

O acrescimo `paymentFeeRate` e uma folga operacional para seguros/taxas estimadas. Ele varia por idade para aproximar melhor o comportamento de simuladores bancarios, porque seguros habitacionais tendem a pesar mais quando a idade e maior.

Referencia atual usada no codigo:

```text
ate 34 anos = 5%
35 a 44 anos = 7%
45 a 49 anos = 10%
50 a 54 anos = 12%
55 anos ou mais = 14%
```

Exemplo conceitual:

```text
valor financiado = R$ 211.000
prazo = 289 meses
taxa nominal = 10% a.a.

parcela estimada = calculada sobre R$ 211.000 no prazo de 289 meses
```

Essa parcela pode ser menor ou maior que a parcela maxima interna. Se for maior, o pacote nao fica compativel e o sistema mostra ajuste de entrada/renda.

## Capacidade de compra

A barra de capacidade mostra quanto do pacote ja esta coberto pela soma:

```text
valor financiado estimado + entrada informada
```

No codigo, esse valor continua salvo como `maxPropertyValue` para compatibilidade com registros antigos, mas a leitura correta na tela e:

```text
maxPropertyValue = financedNeeded + availableEntry
```

Exemplo:

```text
valor do projeto = R$ 264.000
valor do financiamento = R$ 211.200
entrada informada = R$ 25.000

financiamento + entrada = R$ 236.200
entrada que falta = R$ 27.800
```

Essa barra nao deve derrubar a capacidade para `entrada / 20%`. Ela deve mostrar o valor do financiamento e a entrada informada separados, deixando claro quanto ja esta coberto e quanto falta para completar o projeto escolhido.

## Quando fica compativel

O pacote fica compativel quando:

- a idade permite prazo;
- existe margem interna de parcela;
- a entrada informada cobre a entrada necessaria;
- a parcela estimada fica menor ou igual a parcela maxima interna;
- a opcao escolhida existe e foi calculada.

No codigo:

```text
isAvailable =
  isAgeEligible
  && maxInstallment > 0
  && availableEntry >= minimumRequiredEntry
  && estimatedInstallment <= maxInstallment
```

## O que aparece para o cliente

A area principal mostra:

- `Valor do Projeto`;
- `Valor do financiamento`;
- `Valor da entrada`;
- `Parcela Estimada`;
- `Sistema`;
- `Prazo maximo`;
- `Taxa efetiva estimada`;
- barra de `Capacidade de compra`;
- resultado final;
- botao de atendimento.

Nao deve mostrar na area principal:

- parcela maxima;
- financiamento por renda;
- faixa de renda;
- taxa nominal;
- idade ao final;
- enquadramento tecnico;
- mensagens de salvamento no banco.

## Detalhes da analise

O accordion de detalhes fica simples. Ele mostra somente:

- renda considerada;
- valor do financiamento;
- valor da entrada;
- sistema de amortizacao;
- prazo maximo;
- taxa efetiva estimada;
- entrada informada;
- entrada que falta, quando houver.

## Mensagens de ajuste

Prioridade das mensagens:

1. Se falta nascimento:

```text
Informe a data de nascimento para calcular o prazo permitido pela idade.
```

2. Se a idade nao permite prazo:

```text
A idade informada nao permite este prazo de financiamento. O atendimento precisa ajustar prazo, entrada ou composicao.
```

3. Se falta renda:

```text
Informe a renda bruta mensal para calcular a capacidade de financiamento.
```

4. Se as dividas consomem a margem:

```text
As dividas informadas consumiram a margem de parcela. Ajuste as dividas ou componha renda para continuar.
```

5. Se falta entrada:

```text
So precisa ajustar a entrada: falta aproximadamente R$ X para chegar na entrada necessaria de R$ Y.
```

6. Se o pacote esta acima da capacidade:

```text
O pacote ficou aproximadamente R$ X acima da capacidade atual. Ajuste o valor do pacote, aumente a entrada ou componha renda.
```

## Salvamento no banco

Ao calcular a simulacao, o front:

1. calcula o resultado;
2. mostra o resultado ao cliente;
3. envia os dados para `POST /api/v1/simulations`;
4. a API salva a simulacao na tabela `simulations`;
5. o admin acompanha a simulacao como lead.

O cliente nao deve ver mensagens tecnicas como:

- `salvando simulacao no banco`;
- `simulacao salva no admin`;
- ID da simulacao.

No admin, a listagem prioriza os valores salvos em `metadata.frontendResult`, pois sao os valores vistos pelo cliente:

- `desiredPackageValue`;
- `availableEntry`;
- `entryShortfall`;
- `financedNeeded`;
- `estimatedInstallment`;
- `adjustmentMessage`.

## Status no admin

```text
DRAFT = Sem atendimento / novo lead
SENT = Em atendimento
CONVERTED = Convertido
EXPIRED = Expirado
```

Quando uma simulacao vira `CONVERTED`, ela pode gerar um pedido comercial de lead convertido.

## Observacao importante

Esta simulacao e uma estimativa operacional.

Ela nao substitui a analise oficial da CAIXA ou de qualquer instituicao financeira.

A contratacao depende de documentacao, comprovacao de renda, avaliacao do imovel, politica de credito vigente, regras de FGTS, seguros, taxa final, idade, modalidade e demais criterios aplicaveis.
