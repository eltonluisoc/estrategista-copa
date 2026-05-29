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
    const eliminados = await sql`
      SELECT id, nome, email, rodada_eliminacao, status
      FROM usuarios 
      WHERE status = 'eliminado' AND email != 'admin@estrategista.com'
      ORDER BY rodada_eliminacao DESC, nome ASC
      LIMIT 20
    `
    return NextResponse.json(eliminados)
  } catch (error) {
    console.error('Erro ao buscar eliminados:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}