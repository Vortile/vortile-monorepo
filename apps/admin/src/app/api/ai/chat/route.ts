import { NextResponse } from "next/server";
import { processWhatsAppMessage } from "@/lib/ai/gemini";
import { db, whatsappMessages } from "@vortile/database";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      message,
      senderRole = "kitchen",
      restaurantId = "rest_vorti_marmitex",
      phone = "5511999998888",
      history = [],
    } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });
    }

    // Save incoming user message
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    try {
      db.insert(whatsappMessages)
        .values({
          id: msgId,
          restaurantId,
          phone,
          senderType: senderRole,
          content: message,
          createdAt: new Date().toISOString(),
        })
        .run();
    } catch {
      // Non-blocking
    }

    // Process via Gemini MCP Engine
    const aiResult = await processWhatsAppMessage({
      message,
      senderRole,
      restaurantId,
      history,
    });

    // Save AI response
    try {
      db.insert(whatsappMessages)
        .values({
          id: `msg_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          restaurantId,
          phone,
          senderType: "assistant",
          content: aiResult.reply,
          toolCallsJson: JSON.stringify(aiResult.toolsExecuted),
          createdAt: new Date().toISOString(),
        })
        .run();
    } catch {
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      reply: aiResult.reply,
      toolsExecuted: aiResult.toolsExecuted,
      modelUsed: aiResult.modelUsed,
    });
  } catch (error: any) {
    console.error("[API AI Chat Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
