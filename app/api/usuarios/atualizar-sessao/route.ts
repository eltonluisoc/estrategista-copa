import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await getServerSession(auth)
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  
  const usuarios = await sql`
    SELECT aprovado, status FROM usuarios WHERE id = ${session.user.id}
  `
  
  if (usuarios.length === 0) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }
  
  return NextResponse.json({
    aprovado: usuarios[0].aprovado,
    status: usuarios[0].status
  })
}