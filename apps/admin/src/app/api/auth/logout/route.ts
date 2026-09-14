import { NextResponse } from "next/server";
import { revokeSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export const POST = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await revokeSession(token);
    }

    const response = NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro no logout." }, { status: 500 });
  }
};
