# Simulacao de financiamento habitacional

Este documento explica a logica usada na simulacao da plataforma. A simulacao e uma estimativa inicial para atendimento, nao uma aprovacao bancaria.

## Objetivo

A tela responde cinco perguntas para o cliente:

1. O pacote cabe na renda?
2. Quanto pode financiar?
3. Quanto precisa dar de entrada?
4. Qual parcela estimada aparece?
5. Qual ajuste falta, quando nao estiver compativel?

## Entradas principais

O simulador usa estes dados:

- Renda bruta mensal principal.
- Outras rendas, quando informadas.
- Renda do comprador adicional, quando houver composicao de renda.
- Dividas mensais e financiamento atual.
- Valor do terreno.
- Valor do projeto.
- Custo estimado da obra.
- Entrada em dinheiro.
- FGTS, quando marcado para uso.
- Idade, restricoes e perfil basico do cliente.

## Valor do pacote

O valor analisado depende da escolha do cliente:

```text
So terreno = valor do terreno
Terreno + projeto = valor do terreno + valor do projeto
Terreno + projeto + obra = valor do terreno + valor do projeto + custo da obra
Valor manual = valor informado pelo cliente
```

No codigo, esse valor e chamado de `desiredPackageValue`.

## Renda considerada

A renda considerada soma:

```text
renda considerada =
  renda bruta mensal
  + renda informal, se marcada
  + renda do comprador adicional, se marcada
```

No codigo:

```text
totalIncome = monthlyIncome + informalIncome + composedIncome
```

## Parcela maxima

A referencia usada e comprometimento maximo de 30% da renda bruta familiar.

```text
parcela maxima bruta = renda considerada x 30%
parcela maxima final = parcela maxima bruta - dividas mensais
```

No codigo:

```text
maxInstallment = max(totalIncome x 0.30 - debtPressure, 0)
```

Se o cliente informou dividas ou financiamento atual, isso reduz a margem disponivel para a parcela.

## Fator de financiamento

Para estimar o credito pela renda, a simulacao usa o fator `0,0088`.

```text
financiamento por renda = parcela maxima / 0,0088
```

No codigo:

```text
maxCreditByIncome = maxInstallment / 0.0088
```

Exemplo:

```text
renda bruta = R$ 5.000
parcela maxima = R$ 1.500
financiamento por renda = 1.500 / 0,0088
financiamento por renda = aproximadamente R$ 170.454
```

## Cota maxima de financiamento

A regra configurada considera que o banco financia ate 80% do pacote.

```text
financiamento por cota = valor do pacote x 80%
entrada minima por cota = valor do pacote x 20%
```

No codigo:

```text
maxCreditByQuota = desiredPackageValue x 0.80
minimumEntryByQuota = desiredPackageValue x 0.20
```

## Financiamento maximo estimado

O valor maximo financiavel e o menor valor entre:

- financiamento permitido pela renda;
- financiamento permitido pela cota de 80%.

```text
financiamento maximo = menor(financiamento por renda, financiamento por cota)
```

No codigo:

```text
maxCredit = min(maxCreditByIncome, maxCreditByQuota)
```

## Entrada necessaria

A entrada necessaria e o maior valor entre:

- 20% do pacote;
- a diferenca entre o pacote e o financiamento permitido pela renda.

```text
entrada por cota = valor do pacote x 20%
entrada por renda = valor do pacote - financiamento por renda
entrada necessaria = maior(entrada por cota, entrada por renda)
```

No codigo:

```text
minimumRequiredEntry = max(minimumEntryByQuota, minimumEntryByIncome)
```

Isso permite que a tela explique exatamente o ajuste:

```text
So precisa ajustar a entrada: falta aproximadamente R$ X para chegar na entrada necessaria de R$ Y.
```

## Entrada disponivel

A entrada disponivel soma dinheiro e FGTS quando o cliente marcou uso de FGTS.

```text
entrada disponivel = entrada em dinheiro + FGTS considerado
```

No codigo:

```text
availableEntry = downPayment + usableFgts
```

## Falta de entrada

Se a entrada disponivel for menor que a entrada necessaria:

```text
entrada que falta = entrada necessaria - entrada disponivel
```

No codigo:

```text
entryShortfall = max(minimumRequiredEntry - availableEntry, 0)
```

Existe uma tolerancia pequena de `R$ 1` para evitar reprovar por arredondamento.

## Capacidade com entrada informada

A capacidade total com a entrada informada considera dois limites:

1. Limite pela renda:

```text
capacidade por renda = financiamento por renda + entrada disponivel
```

2. Limite pela entrada minima de 20%:

```text
capacidade por entrada = entrada disponivel / 20%
```

O limite final e o menor dos dois.

```text
capacidade com entrada informada =
  menor(capacidade por renda, capacidade por entrada)
```

No codigo:

```text
maxPropertyValue = min(maxCreditByIncome + availableEntry, availableEntry / 0.20)
```

## Valor financiado usado para parcela

Para estimar a parcela, o sistema considera a entrada suficiente para o enquadramento.

```text
entrada usada no cenario = maior(entrada disponivel, entrada necessaria)
valor financiado = valor do pacote - entrada usada no cenario
```

No codigo:

```text
financedNeeded = desiredPackageValue - max(availableEntry, minimumRequiredEntry)
```

## Parcela estimada

A parcela estimada usa o mesmo fator `0,0088`.

```text
parcela estimada = valor financiado x 0,0088
```

No codigo:

```text
estimatedInstallment = financedNeeded x 0.0088
```

## Quando o resultado fica compativel

O pacote fica compativel quando:

- existe parcela maxima disponivel;
- a entrada informada cobre a entrada necessaria;
- a opcao escolhida pelo cliente esta marcada como disponivel.

No codigo:

```text
isApprovedResult = requestedOption.isAvailable
```

Importante: a palavra exibida para o cliente e `Compativel`, nao `Aprovado`, porque aprovacao real depende da analise da instituicao financeira.

## Mensagens de ajuste

Quando nao fica compativel, o sistema prioriza uma explicacao simples:

1. Se falta valor de entrada:

```text
So precisa ajustar a entrada: falta aproximadamente R$ X para chegar na entrada necessaria de R$ Y.
```

2. Se a renda nao foi informada:

```text
Informe a renda bruta mensal para calcular a capacidade de financiamento.
```

3. Se as dividas consumiram a parcela:

```text
As dividas informadas consumiram a margem de parcela. Ajuste as dividas ou componha renda para continuar.
```

4. Se o pacote ficou acima da capacidade:

```text
O pacote ficou aproximadamente R$ X acima da capacidade atual. Ajuste o valor do pacote, aumente a entrada ou componha renda.
```

## Salvamento no banco

Ao clicar em `Ver resultado da simulacao`, o front:

1. calcula o resultado para mostrar na tela;
2. abre o modal com o resultado completo;
3. envia os dados para `POST /api/v1/simulations`;
4. a API salva a simulacao na tabela `simulations`;
5. o admin consegue ver e avancar o status do atendimento.

O admin usa os status:

```text
DRAFT = Novo
SENT = Em atendimento
CONVERTED = Finalizado
EXPIRED = Expirado
```

O botao `Avancar` no admin muda:

```text
Novo -> Em atendimento -> Finalizado
```

## Observacao importante

Esta simulacao e uma estimativa operacional. Ela nao substitui a analise oficial da Caixa ou de qualquer instituicao financeira.

A contratacao depende de documentacao, comprovacao de renda, avaliacao do imovel, politica de credito vigente, regras de FGTS, seguros, taxa final, idade, modalidade e demais criterios aplicaveis.
