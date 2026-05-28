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
    const pendentes = await sql`
      SELECT id, nome, email, status, created_at 
      FROM usuarios 
      WHERE aprovado = false AND email != 'admin@estrategista.com'
      ORDER BY created_at ASC
    `
    return NextResponse.json(pendentes)
  } catch (error) {
    console.error('Erro ao buscar pendentes:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}