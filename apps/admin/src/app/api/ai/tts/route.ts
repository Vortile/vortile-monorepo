import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      text,
      voiceId = "21m00Tcm4TlvDq8ikWAM", // Rachel / Multilingual
      speed = 1.15,
    } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Texto inválido para síntese de voz." },
        { status: 400 }
      );
    }

    // Clean text: strip markdown, bullets, asterisks to make it 100% natural speech
    const cleanText = text
      .replace(/[*_~`#]/g, "")
      .replace(/[•●▪]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    const elevenKey =
      process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;

    // 1. ELEVENLABS ENGINE (Turbo v2.5 - Ultra-Realistic Studio Quality)
    if (elevenKey) {
      try {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": elevenKey,
            },
            body: JSON.stringify({
              text: cleanText,
              model_id: "eleven_turbo_v2_5",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.85,
                speed: Math.min(Math.max(speed, 0.8), 1.5),
              },
            }),
          }
        );

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return new Response(Buffer.from(arrayBuffer), {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
              "X-TTS-Engine": "elevenlabs-turbo-v2.5",
            },
          });
        }
      } catch (err: any) {
        console.warn("[ElevenLabs TTS fallback]:", err?.message);
      }
    }

    // 2. GOOGLE NEURAL BRAZILIAN PORTUGUESE STREAM (High-Fidelity Neural Audio)
    try {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        cleanText
      )}&tl=pt-BR&client=tw-ob`;

      const response = await fetch(googleTtsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return new Response(Buffer.from(arrayBuffer), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
            "X-TTS-Engine": "google-neural-pt-br",
          },
        });
      }
    } catch (err: any) {
      console.warn("[Google Neural TTS fallback]:", err?.message);
    }

    return NextResponse.json(
      { error: "Não foi possível sintetizar áudio de fala." },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[TTS Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Erro interno de TTS" },
      { status: 500 }
    );
  }
};
