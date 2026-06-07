import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { nome } = await request.json()

    if (!nome || nome.trim().length < 2) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 400 })
    }

    await sql`
      UPDATE usuarios 
      SET nome = ${nome.trim()}
      WHERE id = ${session.user.id}
    `

    return NextResponse.json({ success: true, message: 'Nome atualizado com sucesso' })
  } catch (error) {
    console.error('Erro ao atualizar nome:', error)
    return NextResponse.json({ error: 'Erro ao atualizar nome' }, { status: 500 })
  }
}