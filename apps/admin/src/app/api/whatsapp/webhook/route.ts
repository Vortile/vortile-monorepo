import { NextResponse } from "next/server";
import { processWhatsAppMessage } from "@/lib/ai/gemini";
import { db, restaurantStaff, eq } from "@vortile/database";

// Webhook verification endpoint (Meta / WABA standard)
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "vortile_delivery_token";

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "vortile whatsapp webhook active" });
};

// Inbound message receiver
export const POST = async (request: Request) => {
  try {
    const payload = await request.json();

    let senderPhone = "";
    let incomingText = "";

    if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const msgObj = payload.entry[0].changes[0].value.messages[0];
      senderPhone = msgObj.from;
      incomingText = msgObj.text?.body || "";
    } else if (payload.data?.message?.conversation) {
      senderPhone = payload.data.key?.remoteJid?.replace("@s.whatsapp.net", "") || "";
      incomingText = payload.data.message.conversation;
    } else {
      senderPhone = payload.phone || "5511999998888";
      incomingText = payload.message || payload.text || "";
    }

    if (!incomingText) {
      return NextResponse.json({ status: "no message text found" });
    }

    const cleanPhone = senderPhone.replace(/\D/g, "");
    const staffMember = db
      .select()
      .from(restaurantStaff)
      .where(eq(restaurantStaff.phone, cleanPhone))
      .get();

    const senderRole = staffMember ? "kitchen" : "customer";

    console.log(`[WhatsApp Inbound] From ${senderPhone} (${senderRole}): "${incomingText}"`);

    const aiResult = await processWhatsAppMessage({
      message: incomingText,
      senderRole,
      restaurantId: "rest_vorti_marmitex",
    });

    return NextResponse.json({
      success: true,
      senderPhone,
      senderRole,
      reply: aiResult.reply,
      toolsExecuted: aiResult.toolsExecuted,
    });
  } catch (error: any) {
    console.error("[WhatsApp Webhook Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
