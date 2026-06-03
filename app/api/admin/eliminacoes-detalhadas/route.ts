import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Query simplificada para retornar apenas os eliminados
    const eliminados = await sql`
      SELECT 
        id,
        nome,
        email,
        rodada_eliminacao
      FROM usuarios 
      WHERE status = 'eliminado' 
        AND email != 'admin@estrategista.com'
      ORDER BY rodada_eliminacao DESC
      LIMIT 20
    `

    console.log('Eliminados encontrados:', eliminados.length)
    return NextResponse.json(eliminados)
  } catch (error) {
    console.error('Erro ao buscar eliminados:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}