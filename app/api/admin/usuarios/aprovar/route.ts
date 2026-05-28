import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { usuarioId } = await request.json()
    
    await sql`
      UPDATE usuarios 
      SET aprovado = true, status = 'ativo' 
      WHERE id = ${usuarioId}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}