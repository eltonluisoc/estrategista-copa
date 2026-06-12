import { Resend } from 'resend';
import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    const usuarios = await sql`
      SELECT id, nome FROM usuarios WHERE email = ${email}
    `;

    if (usuarios.length === 0) {
      return NextResponse.json({ success: true, message: 'Se o email existir, você receberá um link.' });
    }

    const usuario = usuarios[0];
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await sql`
      INSERT INTO password_resets (usuario_id, token, expires_at)
      VALUES (${usuario.id}, ${token}, ${expiresAt.toISOString()})
    `;

    const resetLink = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${token}`;

    await resend.emails.send({
      from: 'Estrategista da Copa <noreply@estrategistadacopa.com.br>',
      to: email,
      subject: 'Redefinição de Senha',
      html: `<p>Clique no link: <a href="${resetLink}">${resetLink}</a></p><p>Expira em 1 hora.</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}