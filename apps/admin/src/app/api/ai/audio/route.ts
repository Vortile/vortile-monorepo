import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { geminiTools, executeToolCall, KITCHEN_STAFF_SYSTEM_PROMPT } from "@vortile/mcp";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      audioBase64,
      mimeType = "audio/webm",
      restaurantId = "rest_vorti_marmitex",
    } = body;

    if (!audioBase64) {
      return NextResponse.json(
        { error: "audioBase64 é obrigatório." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chave da Google Gemini não configurada." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const tools = [{ functionDeclarations: geminiTools as any }];

    // Send audio directly to Gemini 2.5 Flash native multimodal engine
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${KITCHEN_STAFF_SYSTEM_PROMPT}\n\n[Comando de áudio recebido do montador de marmitas/cozinha. Analise a fala, identifique se deve executar uma ferramenta e responda em texto 100% falável e conciso sem listas.]`,
            },
            {
              inlineData: {
                mimeType,
                data: audioBase64,
              },
            },
          ],
        },
      ],
      config: {
        tools,
        temperature: 0.2,
      },
    });

    const candidate = response.candidates?.[0];
    const functionCalls = candidate?.content?.parts?.filter((p: any) => p.functionCall);
    const toolsExecuted: any[] = [];

    if (candidate?.content && functionCalls && functionCalls.length > 0) {
      const toolResponseParts: any[] = [];
      for (const part of functionCalls) {
        const call = part.functionCall!;
        if (call.name) {
          const toolResult = await executeToolCall(call.name, call.args, restaurantId);
          toolsExecuted.push(toolResult);
          toolResponseParts.push({
            functionResponse: {
              name: call.name,
              response: {
                output: toolResult.result,
                humanMessage: toolResult.humanMessage,
              },
            },
          });
        }
      }

      const finalResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          candidate.content,
          {
            role: "user",
            parts: toolResponseParts,
          },
        ],
        config: {
          tools,
          temperature: 0.2,
        },
      });

      const reply =
        finalResponse.text ||
        toolsExecuted.map((t) => t.humanMessage).join(". ") ||
        "Comando executado com sucesso.";

      return NextResponse.json({
        success: true,
        reply,
        toolsExecuted,
        modelUsed: "google/gemini-2.5-flash (Native Audio MCP)",
      });
    }

    const textReply = response.text || "Comando recebido.";
    return NextResponse.json({
      success: true,
      reply: textReply,
      toolsExecuted: [],
      modelUsed: "google/gemini-2.5-flash (Native Audio)",
    });
  } catch (error: any) {
    console.error("[Audio Command Error]:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao processar áudio com Gemini." },
      { status: 500 }
    );
  }
};
