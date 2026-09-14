import { NextResponse } from "next/server";
import { authenticateWithPin, createSession, SESSION_COOKIE_NAME } from "@/lib/auth";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { emailOrPhone, pin } = body;

    if (!emailOrPhone || !pin) {
      return NextResponse.json(
        { error: "Identificador e PIN de 4 dígitos são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await authenticateWithPin(emailOrPhone, pin);
    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas. Verifique seu e-mail/telefone e PIN." },
        { status: 401 }
      );
    }

    const sessionToken = await createSession(user.id);

    const response = NextResponse.json({
      success: true,
      user,
    });

    // Set secure HTTP-Only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    response.cookies.set({
      name: "vortile_user_role",
      value: user.role,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro no login." }, { status: 500 });
  }
};
