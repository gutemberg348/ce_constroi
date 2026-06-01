# Simulacao habitacional baseada na CAIXA

Este documento explica a logica da simulacao no projeto.

A ideia nao e substituir o Simulador Habitacional CAIXA, nem calcular uma parcela oficial dentro da plataforma.

A ideia correta e:

- usar dados publicos da CAIXA como base de referencia;
- orientar o cliente antes da venda;
- identificar se o pacote parece compativel com linhas da CAIXA;
- gerar uma pre-analise comercial;
- encaminhar o cliente para simular e contratar oficialmente pela CAIXA, Correspondente CAIXA Aqui, agencia ou App Habitacao CAIXA.

Na hora da venda, a simulacao oficial deve ser feita nos canais da CAIXA.

## Fontes oficiais consultadas

- Simulador Habitacional CAIXA: https://www.simuladorhabitacao.caixa.gov.br
- Simulador CAIXA espelhado em `www8.caixa.gov.br`: https://www8.caixa.gov.br
- Financiamento de imoveis CAIXA: https://www.caixa.gov.br/voce/habitacao/financiamento-de-imoveis/Paginas/default.aspx
- Minha Casa, Minha Vida - Habitacao Urbana: https://www.caixa.gov.br/voce/habitacao/minha-casa-minha-vida/urbana/Paginas/default.aspx
- Perguntas frequentes Habitacao CAIXA: https://www.caixa.gov.br/voce/habitacao/perguntas-frequentes-novos-financiamentos
- Uso do FGTS na casa propria: https://www.caixa.gov.br/voce/habitacao/paginas/utilizacao-fgts.aspx
- Noticia CAIXA sobre novas condicoes do MCMV em 2026: https://caixanoticias.caixa.gov.br/Paginas/Not%C3%ADcias/2026/04-ABRIL/CAIXA-inicia-opera%C3%A7%C3%A3o-das-novas-condi%C3%A7%C3%B5es-do-Minha-Casa%2C-Minha-Vida-na-pr%C3%B3xima-quarta-feira-%2822%29.aspx
- Portaria MCID 333/2026: https://www.gov.br/cidades/pt-br/acesso-a-informacao/acoes-e-programas/habitacao/programa-minha-casa-minha-vida/arquivos/PORTARIAMCIDN333DE30DEMARODE2026PORTARIAMCIDN333DE30DEMARODE2026DOUImprensaNacional.pdf

## Principio da plataforma

A plataforma deve trabalhar como uma base de decisao, nao como um banco.

Ela pode dizer:

- este terreno + projeto + obra parece estar dentro de uma faixa de financiamento;
- este cliente parece ter renda compativel ou nao;
- falta entrada/reserva;
- FGTS talvez possa ser usado;
- o pacote precisa ser validado no simulador oficial;
- o atendente deve encaminhar para CAIXA antes de fechar a venda.

Ela nao deve dizer:

- parcela oficial aprovada;
- taxa final aprovada;
- credito aprovado;
- subsidio garantido;
- uso de FGTS garantido;
- contrato aprovado;
- enquadramento juridico definitivo.

## Fluxo correto

1. Cliente escolhe terreno, projeto ou pacote completo.
2. Plataforma coleta dados basicos do cliente e do imovel.
3. Sistema consulta a base de regras CAIXA cadastrada no projeto.
4. Sistema mostra uma orientacao comercial simples.
5. Atendente confere documentos e perfil do cliente.
6. Cliente faz a simulacao oficial no Simulador Habitacional CAIXA, App Habitacao CAIXA, CCA ou agencia.
7. Resultado oficial da CAIXA pode ser anexado ao pedido ou atendimento.
8. A venda so avanca depois da validacao real de credito, documento, avaliacao e contrato.

## O que a base deve guardar

A base deve guardar parametros publicos e versionados.

Exemplo de campos:

```txt
id
provider = CAIXA
program
line
income_min
income_max
property_value_limit
rate_min
rate_max
term_min_months
term_max_months
financing_quota_max
amortization_systems
fgts_allowed
source_url
source_date
rule_version
notes
active
created_at
updated_at
```

Esses dados devem ser tratados como referencia para triagem.

## Dados que o cliente informa

A tela de simulacao deve coletar dados para orientar o atendimento:

- valor do terreno;
- valor do projeto;
- custo estimado de obra;
- cidade e estado do imovel;
- tipo de imovel: novo, usado, construcao, terreno + construcao;
- finalidade: moradia propria, investimento ou outra;
- renda familiar bruta mensal;
- dividas mensais;
- idade do comprador mais velho;
- valor disponivel para entrada;
- saldo aproximado de FGTS;
- se tem 3 anos de trabalho sob regime FGTS;
- se possui financiamento ativo no SFH;
- se possui imovel na mesma cidade/regiao metropolitana;
- se tem restricao cadastral;
- modalidade desejada, quando o cliente souber.

Esses campos ajudam a plataforma a montar uma orientacao, mas nao fecham aprovacao.

## Linhas e programas da CAIXA que importam para o projeto

### Minha Casa, Minha Vida urbano

Pela Portaria MCID 333/2026 e paginas da CAIXA, o MCMV urbano atende familias com renda bruta familiar mensal de ate R$ 13.000.

Faixas urbanas de renda:

| Faixa | Renda familiar mensal |
| --- | --- |
| Faixa Urbano 1 | ate R$ 3.200 |
| Faixa Urbano 2 | de R$ 3.200,01 ate R$ 5.000 |
| Faixa Urbano 3 | de R$ 5.000,01 ate R$ 9.600 |
| Classe Media | acima de R$ 9.600 ate R$ 13.000 |

Valores publicos divulgados em 2026:

| Linha | Valor maximo do imovel |
| --- | --- |
| Faixas 1 e 2 | ate R$ 275.000, conforme recorte populacional/territorial |
| Faixa 3 | ate R$ 400.000 |
| Classe Media | ate R$ 600.000 |

Taxas e prazos publicos divulgados:

| Linha | Taxa nominal de referencia | Prazo de referencia |
| --- | --- | --- |
| MCMV ate R$ 9.600 | de 4,00% a.a. a 8,16% a.a. | de 120 a 420 meses |
| Classe Media ate R$ 13.000 | 10,00% a.a. | ate 420 meses |

Observacao: a tabela divulgada pela CAIXA informa que pode haver redutor de 0,5 ponto percentual para cotistas do FGTS.

### Pro-Cotista Imovel Novo

Na tabela publica divulgada pela CAIXA em 2026:

| Linha | Taxa nominal de referencia | Prazo de referencia | Valor de referencia |
| --- | --- | --- | --- |
| Pro-Cotista Imovel Novo | 8,66% a.a. | de 60 a 420 meses | ate R$ 500.000 |

Essa linha deve entrar na base como referencia, nao como promessa de enquadramento.

### SBPE / SFH

O financiamento de imoveis da CAIXA pode operar no Sistema Financeiro de Habitacao.

Pontos importantes para a base:

- prazo pode chegar a 35 anos;
- a prestacao nao deve passar de referencia de 30% da renda familiar bruta;
- pode haver uso de FGTS quando comprador, contrato e imovel atendem as regras;
- o imovel fica como garantia por alienacao fiduciaria;
- a CAIXA avalia o imovel e as condicoes de pagamento;
- a simulacao oficial mostra opcoes disponiveis para o perfil.

### Construcao e terreno + construcao

Para o projeto, esta e uma linha importante porque o marketplace junta terreno, projeto arquitetonico e obra.

A CAIXA informa modalidades como:

- aquisicao de unidade habitacional;
- construcao de unidade habitacional;
- aquisicao de terreno e construcao de unidade habitacional;
- construcao em terreno proprio;
- conclusao em casos especificos.

A plataforma deve tratar o pacote como uma oportunidade comercial, mas a CAIXA precisa validar:

- terreno;
- projeto;
- documentacao;
- responsavel tecnico;
- proposta de construcao;
- avaliacao;
- cronograma de obra;
- capacidade de pagamento.

## Regras de FGTS para orientar a base

Para usar FGTS, a plataforma pode checar pontos basicos:

- comprador precisa ter pelo menos 3 anos de trabalho sob regime FGTS;
- nao pode possuir financiamento ativo no SFH em qualquer parte do pais;
- nao pode possuir imovel residencial urbano na mesma cidade, municipio limitrofe ou regiao metropolitana onde mora ou trabalha;
- o uso depende do enquadramento do comprador, contrato e imovel;
- a verificacao oficial acontece na CAIXA.

Importante: a plataforma pode indicar "possivel uso de FGTS", nunca "FGTS aprovado".

## Direcao para o codigo

O codigo da simulacao deve ser tratado como motor de triagem.

Ele deve retornar principalmente:

- status comercial;
- linha provavel;
- motivos de atencao;
- documentos/dados que faltam;
- link para simulacao oficial CAIXA;
- orientacao para atendimento humano.

Ele deve evitar retornar:

- parcela oficial;
- taxa final;
- subsidio garantido;
- valor aprovado;
- contrato pronto;
- promessa de credito.

Se houver alguma estimativa numerica interna, ela deve ficar marcada como referencia comercial e nao deve ser usada como argumento final de venda.

## Como a tela deve se comportar

A tela deve ser uma pre-analise, com linguagem comercial:

- "Parece compativel com MCMV";
- "Pode caber em SBPE/SFH";
- "Precisa validar no simulador oficial";
- "Entrada pode estar baixa";
- "FGTS pode depender de regra";
- "Fale com atendente para fechar com a CAIXA".

A tela nao deve mostrar a parcela como valor oficial.

Se mostrar algum numero, deve ser rotulado como:

```txt
estimativa interna
referencia comercial
nao substitui simulacao oficial CAIXA
```

O melhor caminho para evitar risco e mostrar faixas e alertas, nao parcela exata.

## Resultado sugerido da pre-analise

Em vez de calcular parcela, o sistema pode classificar:

```txt
VERDE
Base boa para atendimento.
Encaminhar para simulacao oficial CAIXA.

AMARELO
Precisa ajustar entrada, documentacao, renda ou escolha do pacote.

VERMELHO
Fora da base de referencia cadastrada.
Cliente deve falar com atendente antes de seguir.
```

Tambem pode listar motivos:

- renda fora da faixa;
- valor do pacote acima do limite da linha;
- entrada baixa;
- possivel impedimento de FGTS;
- idade pode limitar prazo;
- restricao cadastral precisa ser resolvida;
- finalidade nao parece moradia propria;
- pacote precisa de validacao de terreno + construcao.

## Como atualizar a base

Sempre que a CAIXA ou o Governo Federal atualizar regras:

1. Registrar a fonte oficial.
2. Criar nova versao da regra.
3. Manter a versao antiga para historico.
4. Marcar a nova como ativa.
5. Atualizar este documento.
6. Revisar textos da tela de simulacao.

Formato recomendado de versao:

```txt
caixa-public-YYYY-MM-DD
```

Exemplo:

```txt
caixa-public-2026-04-22
```

## Regra final do negocio

O sistema ajuda a vender melhor, mas nao aprova financiamento.

A plataforma organiza:

- cliente;
- pacote;
- terreno;
- projeto;
- obra;
- entrada;
- renda;
- possivel linha;
- alertas.

A CAIXA valida:

- credito;
- taxa;
- prazo;
- prestacao;
- subsidio;
- FGTS;
- documentacao;
- avaliacao do imovel;
- contrato.

Por isso, a venda deve sempre passar pela simulacao oficial da CAIXA antes de qualquer promessa ao cliente.
