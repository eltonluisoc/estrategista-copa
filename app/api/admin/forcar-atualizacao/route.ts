import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (session?.user?.email !== 'admin@estrategista.com') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { usuarioId } = await request.json()

    // Buscar dados atualizados do usuário
    const usuarios = await sql`
      SELECT id, email, nome, aprovado, status 
      FROM usuarios 
      WHERE id = ${usuarioId}
    `

    if (usuarios.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const usuario = usuarios[0]

    // Retornar dados atualizados para o front-end
    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        aprovado: usuario.aprovado,
        status: usuario.status
      }
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}