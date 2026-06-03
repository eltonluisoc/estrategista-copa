import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  // Verificar autenticação
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    // Buscar detalhes das eliminações
    const eliminados = await sql`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.rodada_eliminacao,
        p.rodada as rodada_palpite,
        t.nome as time_escolhido,
        j.time_casa,
        j.time_fora,
        j.gols_casa,
        j.gols_fora,
        (SELECT nome FROM times WHERE id = j.vencedor_id) as vencedor
      FROM usuarios u
      LEFT JOIN palpites p ON p.usuario_id = u.id AND p.rodada = u.rodada_eliminacao
      LEFT JOIN times t ON t.id = p.time_id
      LEFT JOIN jogos j ON j.rodada = u.rodada_eliminacao
      WHERE u.status = 'eliminado' AND u.email != 'admin@estrategista.com'
      ORDER BY u.rodada_eliminacao DESC, u.created_at DESC
      LIMIT 20
    `

    return NextResponse.json(eliminados)
  } catch (error) {
    console.error('Erro ao buscar eliminados:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}