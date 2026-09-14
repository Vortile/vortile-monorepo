# Vortile Delivery — Estudo Econômico de Modelos Google Gemini & Custos Operacionais

> **Documento de Referência Financeira e de Arquitetura de IA**  
> **Data de Atualização:** Setembro / 2026  
> **Autor:** Engenharia Vortile  
> **Foco:** Viabilidade econômica do agente inteligente WhatsApp e Copilot de Cozinha por voz com MCP para restaurantes e marmitarias brasileiras.

---

## 1. Escolha do Modelo: Por que o Gemini 2.5 Flash?

Para o fluxo operacional da Vortile (atendimento ao cliente e suporte operacional ao montador de marmitas/cozinha via WhatsApp e Copilot de voz), a escolha do modelo segue três critérios inegociáveis:

1. **Latência de Resposta**: Mensagens e comandos de voz exigem respostas em menos de 1,5 segundos.
2. **Suporte Robusto a Chamadas de Ferramentas (MCP / Tool Calling)**: O modelo precisa identificar intenções complexas (ex: *"acabou o purê de batata"* ou *"avisa o Carlos que o motoboy saiu"*) e disparar parâmetros tipados para o banco SQLite.
3. **Custo Marginal Próximo de Zero**: O modelo não pode onerar o preço final da marmita nem inviabilizar os planos de assinatura do restaurante.

### Comparativo de Modelos Google

| Modelo | Latência Média | Tool Calling | Custo Entrada (por 1M tokens) | Custo Saída (por 1M tokens) | Recomendação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Gemini 2.5 Flash** (Atual) | **~600ms** | **Excelente** | **$0,15** | **$0,60** | **Modelo Principal (Produção)** |
| **Gemini 2.5 Flash-Lite** | ~400ms | Muito Bom | $0,075 | $0,30 | Alternativa ultra-econômica |
| **Gemini 3.5 Transcribe** | ~300ms (STT puro) | Não executa tools | ~$0,002 / min áudio | - | Especializado em transcrição bruta |
| **Gemini 2.5 Pro** | ~2.200ms | Excelente | $1,25 | $5,00 | Excessivo para chat rápido |

---

## 2. Cenário Realista: Restaurante com 30 Pedidos / Dia

Abaixo calculamos a volumetria detalhada de um restaurante ou marmitaria padrão de bairro atendendo **30 pedidos por dia** (volume comum em dias de semana no almoço brasileiro).

### A. Perfil de Tráfego Mensal (30 dias = 900 pedidos/mês)

- **Divisão de Canais**:
  - **40% dos pedidos** chegam diretamente pelo link do Cardápio Web PWA (`apps/delivery`), consumindo 0 tokens de IA.
  - **60% dos pedidos** (18 pedidos/dia) são iniciados ou finalizados via WhatsApp conversacional.
- **Interações de Clientes no WhatsApp**:
  - ~4 mensagens trocadas por pedido (Dúvida do cardápio → Escolha de guarnições → Endereço → Confirmação de PIX).
  - 18 pedidos × 4 mensagens = **72 mensagens de clientes / dia**.
- **Comandos Operacionais da Cozinha / Atendente (Copilot MCP de Voz/Texto)**:
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
| **Schemas das Ferramentas MCP (JSON Schema)** | ~650 tokens | 7 ferramentas ativas |
| **Histórico Recente da Conversa (últimas mensagens)** | ~300 tokens | Contexto imediato do cliente |
| **Mensagem do Usuário** | ~25 tokens | Texto digitado ou transcrito |
| **Retorno da Execução da Ferramenta (Loop MCP)** | ~125 tokens | Executado apenas quando há tool call |
| **Média Ponderada de Entrada por Turno** | **~1.400 tokens** | **Input Tokens** |
| **Resposta Falável da IA (Saída)** | **~75 tokens** | **Output Tokens** |

---

## 4. Demonstrativo Financeiro Mensal (Texto & WhatsApp)

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

## 5. Áudio & Comandos de Voz: Gemini 3.5 Transcribe vs. Gemini 2.5 Flash Nativo

Uma das dúvidas mais comuns é: **devemos transcrever o áudio primeiro com um modelo dedicado (como Gemini 3.5 Transcribe) ou enviar o áudio direto para o Gemini 2.5 Flash? E a IA vai falar de volta com o operador?**

### A. Comparativo Técnico de Abordagens de Áudio

| Critério | Pipeline de 2 Etapas (Gemini 3.5 Transcribe + LLM) | Gemini 2.5 Flash Nativo Multimodal (Recomendado) |
| :--- | :--- | :--- |
| **Arquitetura** | Áudio ➔ Transcrição de Texto ➔ Envio para Gemini com MCP Tools | Áudio ➔ Gemini 2.5 Flash (Entende áudio e executa Tool no mesmo turno) |
| **Latência Total** | ~350ms (transcrição) + ~650ms (MCP) = **~1.000ms** | **~650ms (Turno Único)** |
| **Complexidade** | 2 chamadas de API separadas | **1 única chamada HTTP** |
| **Compreensão de Sotaques** | Pode errar termos regionais na transcrição crua | Interpreta entonação, gírias e intenções culinárias diretamente |
| **Custo de Áudio** | ~$0,002 por minuto de áudio | **32 tokens por segundo de áudio** ($0,15 / 1M tokens) |

### B. Quanto Custa o Áudio no Gemini 2.5 Flash Nativo?
- A Google precifica áudio multimodal a **32 tokens de entrada por segundo**.
- Um comando de cozinha típico (ex: *"Despacha o 117 com o Marcos, vinte minutos"*) dura cerca de **3 a 4 segundos**.
- 4 segundos de áudio = **128 tokens de entrada**.
- Se o restaurante emitir **30 comandos de voz por dia** (900 comandos/mês):
  $$900 \times 128 \text{ tokens} = 115.200 \text{ tokens de áudio / mês}$$
- Custo a \$0,15 por 1M tokens:
  $$0,1152 \times \$0,15 = \mathbf{\$0,017 \text{ USD / mês (cerca de R\$ 0,09 / menos de dez centavos de Real por mês!)}}$$

> **Conclusão:** O **Gemini 2.5 Flash Nativo Multimodal** é muito superior ao Gemini 3.5 Transcribe para a nossa aplicação. Ele elimina uma etapa de rede, reduz a latência para menos de 700ms e custa centésimos de centavo de real.

### C. A IA Fala de Volta com o Operador? ("Ele vai falar algo?")
**SIM!** Toda resposta retornada pelo Copilot é processada com duas ações simultâneas:
1. **Confirmação Visual:** O balão da resposta aparece com a ação executada em tempo real (ex: *"Pausei Costelinha Suína no cardápio online agora mesmo"*).
2. **Síntese de Voz Imediata (Text-to-Speech):** O navegador aciona automaticamente a `SpeechSynthesisUtterance` com voz em português brasileiro natural (`lang: pt-BR`). O operador ouve a confirmação sonora na bancada sem precisar desviar o olhar nem pegar no mouse.

---

## 6. Comparativo com Alternativas de Mercado

| Solução | Custo Mensal | Experiência do Cliente | Capacidade da Cozinha |
| :--- | :--- | :--- | :--- |
| **Atendente Humano Dedicado** | R$ 1.800 a R$ 2.400 (salário + encargos) | Humanizada, porém lenta em picos de 12h | Depende de conferência manual |
| **Chatbot Tradicional (Anota AI / Saipos)** | R$ 180 a R$ 350 / mês | Menus numéricos rígidos (*"Digite 1 para cardápio"*), trava em exceções | Cozinha precisa acessar painel web para pausar pratos |
| **Vortile com Gemini 2.5 Flash MCP & Voz** | **R$ 3,73 / mês** (Custo Google total) | Conversa 100% natural, áudio falado, entende gírias e adaptações | Cozinha comanda por **2x cliques na barra de espaço** |
