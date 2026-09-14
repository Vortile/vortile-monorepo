# Vortile Delivery — Estudo Econômico de Modelos Google Gemini & Custos Operacionais

> **Documento de Referência Financeira e de Arquitetura de IA**  
> **Data de Atualização:** Setembro / 2026  
> **Autor:** Engenharia Vortile  
> **Foco:** Viabilidade econômica do agente inteligente WhatsApp com MCP para restaurantes e marmitarias brasileiras.

---

## 1. Escolha do Modelo: Por que o Gemini 2.5 Flash?

Para o fluxo operacional da Vortile (atendimento ao cliente e suporte operacional ao montador de marmitas/cozinha via WhatsApp), a escolha do modelo segue três critérios inegociáveis:

1. **Latência de Resposta**: Mensagens de WhatsApp exigem respostas em menos de 1,5 segundos.
2. **Suporte Robusto a Chamadas de Ferramentas (MCP / Tool Calling)**: O modelo precisa identificar intenções complexas (ex: *"acabou o purê de batata"* ou *"avisa o Carlos que o motoboy saiu"*) e disparar parâmetros tipados para o banco SQLite.
3. **Custo Marginal Próximo de Zero**: O modelo não pode onerar o preço final da marmita nem inviabilizar os planos de assinatura do restaurante.

### Comparativo de Modelos Google

| Modelo | Latência Média | Tool Calling | Custo Entrada (por 1M tokens) | Custo Saída (por 1M tokens) | Recomendação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash** (Atual) | **~600ms** | **Excelente** | **$0,15** | **$0,60** | **Modelo Principal (Produção)** |
| **Gemini 2.5 Flash-Lite** | ~400ms | Muito Bom | $0,075 | $0,30 | Alternativa ultra-econômica |
| **Gemini 2.5 Pro** | ~2.200ms | Excelente | $1,25 | $5,00 | Excessivo para chat rápido |
| **Modelos Concorrentes (GPT-4o mini)** | ~900ms | Bom | $0,15 | $0,60 | Sem vantagem em português sobre Gemini |

> **Conclusão:** O **Gemini 2.5 Flash** é o equilíbrio perfeito. Ele possui compreensão de linguagem natural em português brasileiro coloquial (*"bota mais farofa"*, *"troca o refri"*, *"acabou a bisteca"*), suporte a `thoughtSignature` nativo e custo irrisório.

---

## 2. Cenário Realista: Restaurante com 30 Pedidos / Dia

Abaixo calculamos a volumetria detalhada de um restaurante ou marmitaria padrão de bairro atendendo **30 pedidos por dia** (volume comum em dias de semana no almoço brasileiro).

### A. Perfil de Tráfego Mensal (30 dias = 900 pedidos/mês)

- **Divisão de Canais**:
  - **40% dos pedidos** chegam diretamente pelo link do Cardápio Web PWA (`/delivery`), consumindo 0 tokens de IA.
  - **60% dos pedidos** (18 pedidos/dia) são iniciados ou finalizados via WhatsApp conversacional.
- **Interações de Clientes no WhatsApp**:
  - ~4 mensagens trocadas por pedido (Dúvida do cardápio → Escolha de guarnições → Endereço → Confirmação de PIX).
  - 18 pedidos × 4 mensagens = **72 mensagens de clientes / dia**.
- **Comandos Operacionais da Cozinha / Atendente (MCP Tools)**:
  - Consulta de pedidos abertos: ~5 vezes ao dia.
  - Pausa de ingredientes esgotados / reativações: ~3 vezes ao dia.
  - Avisos de despacho / mensagens para motoboy: ~5 vezes ao dia.
  - Total de comandos internos = **13 mensagens internas / dia**.
- **Volume Total Mensal de Mensagens Processadas pela IA**:
  - $(72 + 13) \times 30 \text{ dias} = \mathbf{2.550 \text{ mensagens / mês}}$.

---

## 3. Consumo de Tokens por Interação (Com Schema MCP)

Cada chamada enviada ao Gemini carrega as declarações de ferramentas MCP (`get_delivery_status_overview`, `toggle_option_availability`, `list_open_orders`, etc.):

| Componente | Tokens Estimados | Observação |
| :--- | :--- | :--- |
| **System Prompt + Instruções de Fala Concisa** | ~350 tokens | Define tom falável, sem bullets |
| **Schemas das Ferramentas MCP (JSON Schema)** | ~650 tokens | 6 ferramentas ativas |
| **Histórico Recente da Conversa (últimas mensagens)** | ~300 tokens | Contexto imediato do cliente |
| **Mensagem do Usuário** | ~25 tokens | Texto digitado ou transcrito |
| **Retorno da Execução da Ferramenta (Loop MCP)** | ~125 tokens | Executado apenas quando há tool call |
| **Média Ponderada de Entrada por Turno** | **~1.400 tokens** | **Input Tokens** |
| **Resposta Falável da IA (Saída)** | **~75 tokens** | **Output Tokens** |

---

## 4. Demonstrativo Financeiro Mensal

### Consumo Bruto Mensal (2.550 mensagens)
- **Tokens de Entrada:** $2.550 \times 1.400 = \mathbf{3.570.000 \text{ tokens}}$ (~3,57 milhões)
- **Tokens de Saída:** $2.550 \times 75 = \mathbf{191.250 \text{ tokens}}$ (~0,19 milhão)

### Custo em Dólares (USD)
$$\text{Custo de Entrada} = 3,57 \times \$0,15 = \$0,5355 \text{ USD}$$
$$\text{Custo de Saída} = 0,191 \times \$0,60 = \$0,1146 \text{ USD}$$
$$\mathbf{\text{Custo Total Mensal de IA}} = \$0,5355 + \$0,1146 = \mathbf{\$0,65 \text{ USD / mês}}$$

### Custo em Reais (BRL — Cotação R$ 5,60)
$$\mathbf{\text{Custo Total Mensal}} = \$0,65 \times 5,60 = \mathbf{R\$\ 3,64 \text{ por mês!}}$$

### Custo por Pedido Faturado
$$\text{Custo de IA por Marmita} = \frac{R\$\ 3,64}{900 \text{ pedidos}} = \mathbf{R\$\ 0,0040 \text{ (menos de meio centavo de Real!)}}$$

---

## 5. Comparativo com Alternativas de Mercado

| Solução | Custo Mensal | Experiência do Cliente | Capacidade da Cozinha |
| :--- | :--- | :--- | :--- |
| **Atendente Humano Dedicado** | R$ 1.800 a R$ 2.400 (salário + encargos) | Humanizada, porém lenta em picos de 12h | Depende de conferência manual |
| **Chatbot Tradicional (Anota AI / Saipos)** | R$ 180 a R$ 350 / mês | Menus numéricos rígidos (*"Digite 1 para cardápio"*), trava em exceções | Cozinha precisa acessar painel web para pausar pratos |
| **Vortile + Gemini 2.5 Flash MCP** | **R$ 3,64 / mês** (Custo Google) | Conversa 100% natural, entende gírias e adaptações em áudio ou texto | Cozinha pausa itens via áudio do WhatsApp em 2 segundos |

---

## 6. Oportunidades de Redução Adicional de Custos (Escala)

1. **Context Caching do Gemini**:
   Para planos onde o restaurante troca mais de 10.000 mensagens/mês, os schemas das ferramentas MCP e o prompt de sistema podem ser armazenados no cache da Google, reduzindo o custo de tokens de entrada em **75%** (de \$0,15 para **\$0,0375** por 1M tokens).
2. **Fallback Inteligente para Gemini 2.5 Flash-Lite**:
   Para mensagens simples de triagem (ex: saudações *"olá"*, confirmações de recebimento), o backend pode rotear automaticamente para o **Gemini 2.5 Flash-Lite**, que custa a metade do preço (\$0,075 / 1M).

---

## 7. Diretrizes Técnicas para o Desenvolvedor
- Nunca exponha a chave de API nos repositórios git; mantenha-a restrita ao arquivo local `.env.local`.
- Monitore a latência das chamadas em `/api/ai/chat` e registre métricas de tokens consumidos para auditoria de margem do restaurante.
- Mantenha respostas curtas e faláveis (inferiores a 150 caracteres sempre que possível) para economizar tokens de saída e garantir áudio natural no WhatsApp.
