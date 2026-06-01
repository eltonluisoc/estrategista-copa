import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Verificar se o admin existe
    const adminExistente = await sql`
      SELECT id, email FROM usuarios WHERE email = 'admin@estrategista.com'
    `
    
    if (adminExistente.length === 0) {
      return NextResponse.json({ 
        error: 'Usuário admin não encontrado no banco de dados' 
      }, { status: 404 })
    }
    
    const novaSenha = '172163172163'
    
    const result = await sql`
      UPDATE usuarios 
      SET senha = ${novaSenha}
      WHERE email = 'admin@estrategista.com'
      RETURNING id, email
    `
    
    if (result.length === 0) {
      return NextResponse.json({ 
        error: 'Falha ao atualizar a senha' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Senha do admin atualizada com sucesso!',
      novaSenha: novaSenha
    })
    
  } catch (error) {
    console.error('Erro detalhado:', error)
    return NextResponse.json({ 
      error: 'Erro ao atualizar senha',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}