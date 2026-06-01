import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Query corrigida sem template string problemático
    const classificacao = await sql`
      SELECT 
        u.id,
        u.nome,
        u.email,
        u.status,
        u.rodada_eliminacao,
        COUNT(CASE WHEN j.finalizado = true AND j.vencedor_id = p.time_id THEN 1 END) as acertos
      FROM usuarios u
      LEFT JOIN palpites p ON p.usuario_id = u.id
      LEFT JOIN jogos j ON j.rodada = p.rodada 
        AND (j.time_casa = (SELECT nome FROM times WHERE id = p.time_id) 
          OR j.time_fora = (SELECT nome FROM times WHERE id = p.time_id))
      WHERE u.email != 'admin@estrategista.com'
      GROUP BY u.id, u.nome, u.email, u.status, u.rodada_eliminacao
      ORDER BY acertos DESC, u.nome ASC
    `
    
    return NextResponse.json(classificacao)
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao carregar classificação' }, { status: 500 })
  }
}