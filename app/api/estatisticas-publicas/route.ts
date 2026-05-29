import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    const usuarios = await sql`
      SELECT status, COUNT(*) as total 
      FROM usuarios 
      WHERE email != 'admin@estrategista.com'
      GROUP BY status
    `
    
    let ativos = 0
    let eliminados = 0
    
    for (const u of usuarios) {
      if (u.status === 'ativo') ativos = parseInt(u.total)
      if (u.status === 'eliminado') eliminados = parseInt(u.total)
    }
    
    return NextResponse.json({
      total: ativos + eliminados,
      ativos,
      eliminados
    })
  } catch (error) {
    console.error('Erro:', error)
    return NextResponse.json({ total: 0, ativos: 0, eliminados: 0 })
  }
}