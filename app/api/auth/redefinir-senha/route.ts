import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { token, novaSenha } = await request.json();

    const resetRequests = await sql`
      SELECT usuario_id, expires_at
      FROM password_resets
      WHERE token = ${token} AND used = FALSE
    `;

    if (resetRequests.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const resetRequest = resetRequests[0];
    const now = new Date();
    const expiresAt = new Date(resetRequest.expires_at);

    if (now > expiresAt) {
      return NextResponse.json({ error: 'Token expirado' }, { status: 400 });
    }

    await sql`
      UPDATE usuarios SET senha = ${novaSenha}
      WHERE id = ${resetRequest.usuario_id}
    `;

    await sql`
      UPDATE password_resets SET used = TRUE WHERE token = ${token}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}