import { auth } from '@/auth';
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { novaSenha } = await request.json();

    if (!novaSenha || novaSenha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    // Atualizar a senha diretamente (sem hash por enquanto)
    await sql`
      UPDATE usuarios 
      SET senha = ${novaSenha}
      WHERE id = ${session.user.id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}