import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const { novaSenha } = await request.json()
    const senha = novaSenha || '172163172163'
    
    // Verificar se o admin existe
    const adminExistente = await sql`
      SELECT id, email FROM usuarios WHERE email = 'admin@estrategista.com'
    `
    
    if (adminExistente.length === 0) {
      return NextResponse.json({ 
        error: 'Usuário admin não encontrado no banco de dados' 
      }, { status: 404 })
    }
    
    // Atualizar senha diretamente
    const result = await sql`
      UPDATE usuarios 
      SET senha = ${senha}
      WHERE email = 'admin@estrategista.com'
      RETURNING id, email
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Senha do admin atualizada com sucesso!',
      email: result[0].email,
      senha: senha
    })
    
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ 
      error: 'Erro ao resetar senha',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar se o admin existe
    const adminExistente = await sql`
      SELECT id, email FROM usuarios WHERE email = 'admin@estrategista.com'
    `
    
    if (adminExistente.length === 0) {
      return NextResponse.json({ 
        error: 'Usuário admin não encontrado' 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin existe no banco',
      email: adminExistente[0].email
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao verificar admin' }, { status: 500 })
  }
}