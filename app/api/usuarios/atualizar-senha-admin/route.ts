import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    const novaSenha = '172163172163'
    const senhaHash = await bcrypt.hash(novaSenha, 10)
    
    await sql`
      UPDATE usuarios 
      SET senha = ${senhaHash}
      WHERE email = 'admin@estrategista.com'
    `
    
    return NextResponse.json({ success: true, message: 'Senha do admin atualizada para 172163172163' })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
  }
}