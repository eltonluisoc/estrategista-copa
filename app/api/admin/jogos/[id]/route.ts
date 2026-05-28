import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const databaseUrl = process.env.DATABASE_URL
const sql = neon(databaseUrl || '')

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`DELETE FROM jogos WHERE id = ${parseInt(id)}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar jogo:', error)
    return NextResponse.json({ error: 'Erro ao deletar jogo' }, { status: 500 })
  }
}