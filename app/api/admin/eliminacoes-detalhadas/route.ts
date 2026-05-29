import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const eliminacoes = await sql`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.rodada_eliminacao,
        p.time_id,
        t.nome as time_escolhido,
        j.time_casa,
        j.time_fora,
        j.gols_casa,
        j.gols_fora,
        j.vencedor_id,
        v.nome as vencedor
      FROM usuarios u
      JOIN palpites p ON u.id = p.usuario_id AND p.rodada = u.rodada_eliminacao
      JOIN times t ON p.time_id = t.id
      JOIN jogos j ON j.rodada = u.rodada_eliminacao
      LEFT JOIN times v ON j.vencedor_id = v.id
      WHERE u.status = 'eliminado' 
        AND u.email != 'admin@estrategista.com'
        AND j.finalizado = true
      ORDER BY u.rodada_eliminacao DESC, u.nome ASC
    `
    return NextResponse.json(eliminacoes)
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}