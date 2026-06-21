import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const eliminados = await sql`
      SELECT 
        rodada_eliminacao,
        COUNT(*) as total
      FROM usuarios 
      WHERE status = 'eliminado'
        AND email != 'admin@estrategista.com'
      GROUP BY rodada_eliminacao
      ORDER BY rodada_eliminacao ASC
    `
    
    return NextResponse.json(eliminados)
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao buscar eliminados' }, { status: 500 })
  }
}