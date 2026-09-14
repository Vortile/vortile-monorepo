# Vortile Design Manifesto — Padrão de Engenharia & UX

Este documento é a lei estética e de interação do projeto Vortile Delivery.
Antes de propor ou codificar qualquer tela ou componente, valide contra estas 5 regras:

---

## 1. O Princípio da Subtração (Dieter Rams / Linear Standard)
- **Nunca use caixas dentro de caixas ("efeito boneca russa")**:
  Hierarquia se constrói com espaço em branco (whitespace), alinhamento milimétrico e peso tipográfico (font-weight), não com camadas empilhadas de bordas coloridas.
- **Informação respirável**:
  Se uma informação pode ser lida em uma linha sutil com cor neutra (ex: `stone-500`), ela JAMAIS deve estar dentro de uma caixa amarela ou cinza com borda pesada.
- **Economia cromática**:
  Máximo de 1 cor de destaque (accent) por bloco visual. Cores semafóricas (verde, laranja, vermelho) são reservadas exclusivamente para status vitais que exigem ação imediata.

---

## 2. Zero "Developer Leakage" (A Regra do Balcão de Marmitaria)
- **Proibido qualquer jargão técnico de programação ou arquitetura na UI**:
  NUNCA exiba ao operador ou ao cliente: `"SQLite"`, `"MCP"`, `"Webhook"`, `"Payload"`, `"Sync"`, `"API"`, `"JSON"`, `"Instância"`.
- **Linguagem 100% natural do restaurante brasileiro**:
  - Em vez de *"Esteira Kanban Sincronizada via SQLite"*, use apenas *"Pedidos"* ou *"Esteira de Pedidos"*.
  - Em vez de *"Tool Execution toggle_option"*, mostre apenas *"Purê pausado no cardápio"*.
- **Sem poluição de badges**:
  Não coloque badges coloridos em todos os itens de menu lateral. Quando tudo grita, nada se destaca.

---

## 3. IA-First Delegation (Substituição de Botões por Copilot MCP)
- **Fim da árvore de botões repetitivos**:
  Evite empilhar 4 ou 5 botões pequenos dentro de cada comanda de pedido.
- **Ações multi-etapas pertencem ao Copilot de Cozinha**:
  Despachar com motoboy digitando minutos, enviar avisos no WhatsApp para clientes ou pausar guarnições esgotadas são acionadas em 1 toque através do **Botão de Comando por Voz/Texto (Copilot MCP)**.
- **Comanda legível em 300 milissegundos**:
  `Número em destaque (#118)` ➔ `Itens principais da refeição` ➔ `Endereço/Entrega` ➔ `1 Ação Primária Contextual`.

---

## 4. O Cardápio é para Vender, não para Exibir Esquema de Banco
- **Listagem visual limpa**:
  A listagem de pratos deve exibir apenas: Foto de alto apetite, Título, Preço, Categoria e Switch elegante de Ativo/Pausado.
- **Sem explosão de banco de dados no card**:
  Nunca cuspa 20 guarnições soltas dentro de cada card da vitrine principal.
- **Drawer lateral focado (Slide-over)**:
  A edição de guarnições, limites de carnes e complementos abre em um painel lateral focado, mantendo a visão geral leve e navegável.

---

## 5. Voz e Respostas da IA: Regra dos 5 Segundos
- **Saída 100% falável e concisa**:
  Respostas da IA devem ter no máximo 2 frases corridas, prontas para sintetizador de áudio (TTS) ou leitura dinâmica.
- **Zero marcadores de lista**:
  NUNCA use marcadores (`•`), asteriscos (`*`), hashtags (`#`) ou listas formatadas em chats de voz ou WhatsApp operacional.
- O operador deve escutar e entender a confirmação em 5 segundos sem tirar as mãos da bancada de montagem.
