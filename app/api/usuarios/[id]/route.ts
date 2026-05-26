import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const usuarios = await sql`
      SELECT id, email, nome, status, rodada_eliminacao, created_at
      FROM usuarios WHERE id = ${params.id}
    `

    if (usuarios.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json(usuarios[0])
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar usuário' }, { status: 500 })
  }
}