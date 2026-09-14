import { NextResponse } from "next/server";
import { validateSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export const GET = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const sessionData = await validateSessionToken(token);
    if (!sessionData) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: sessionData.user,
      expiresAt: sessionData.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro de sessão." }, { status: 500 });
  }
};
