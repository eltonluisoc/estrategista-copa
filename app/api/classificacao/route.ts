import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const grupo = searchParams.get('grupo')
  
  let query = `
    SELECT c.*, t.nome as time_nome 
    FROM classificacao c
    JOIN times t ON c.time_id = t.id
    ORDER BY c.grupo, c.pontos DESC, c.saldo_gols DESC, c.gols_pro DESC
  `
  
  if (grupo) {
    query = `
      SELECT c.*, t.nome as time_nome 
      FROM classificacao c
      JOIN times t ON c.time_id = t.id
      WHERE c.grupo = '${grupo}'
      ORDER BY c.pontos DESC, c.saldo_gols DESC, c.gols_pro DESC
    `
  }
  
  const classificacao = await sql(query)
  return NextResponse.json(classificacao)
}