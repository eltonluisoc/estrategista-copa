import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rodada = searchParams.get('rodada')

  if (!rodada) {
    return NextResponse.json({ error: 'Rodada é obrigatória' }, { status: 400 })
  }

  const palpites = await sql`
    SELECT p.*, t.nome as time_nome 
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    WHERE p.rodada = ${parseInt(rodada)}
  `
  return NextResponse.json(palpites)
}