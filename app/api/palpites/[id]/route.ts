import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  
  const palpite = await sql`
    SELECT p.*, j.prazo, j.rodada
    FROM palpites p
    JOIN jogos j ON j.rodada = p.rodada
    WHERE p.id = ${id}
  `
  
  if (palpite.length === 0) {
    return NextResponse.json({ error: 'Palpite não encontrado' }, { status: 404 })
  }
  
  const prazo = new Date(palpite[0].prazo)
  const agora = new Date()
  
  if (agora > prazo) {
    return NextResponse.json({ 
      error: 'Prazo para alterar este palpite já encerrado (23h59 do dia anterior ao jogo)' 
    }, { status: 400 })
  }
  
  await sql`DELETE FROM palpites WHERE id = ${id}`
  
  return NextResponse.json({ success: true, rodada: palpite[0].rodada })
}