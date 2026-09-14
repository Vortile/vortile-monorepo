import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Texto inválido para síntese" }, { status: 400 });
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY;

    // 1. If ElevenLabs Key is available, fetch real studio-quality audio
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
              text,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.8,
              },
            }),
          }
        );

        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return new Response(buffer, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=3600",
            },
          });
        }
      } catch (e: any) {
        console.warn("[ElevenLabs TTS fallback to Web Speech]:", e.message);
      }
    }

    // 2. Return synthesized speech payload for high-fidelity client Web Speech Synthesis
    return NextResponse.json({
      success: true,
      mode: "client_speech_synthesis",
      text,
      lang: "pt-BR",
      pitch: 1.0,
      rate: 1.05,
    });
  } catch (error: any) {
    console.error("[TTS Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
