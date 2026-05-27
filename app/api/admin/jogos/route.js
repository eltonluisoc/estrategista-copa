import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const jogos = await sql`SELECT * FROM jogos ORDER BY data_hora`
  return NextResponse.json(jogos)
}

export async function POST(request: Request) {
  const { jogoId, vencedor, rodada } = await request.json()
  
  await sql`
    UPDATE jogos 
    SET vencedor_id = (SELECT id FROM times WHERE nome = ${vencedor}), finalizado = true 
    WHERE id = ${jogoId}
  `
  
  const palpitesErrados = await sql`
    SELECT p.usuario_id FROM palpites p
    WHERE p.rodada = ${rodada} 
    AND p.time_id != (SELECT id FROM times WHERE nome = ${vencedor})
  `
  
  for (const p of palpitesErrados) {
    await sql`
      UPDATE usuarios 
      SET status = 'eliminado', rodada_eliminacao = ${rodada} 
      WHERE id = ${p.usuario_id} AND status = 'ativo'
    `
  }
  
  return NextResponse.json({ eliminados: palpitesErrados.length })
}

export async function PUT(request: Request) {
  const { id, time_casa, time_fora, data_hora, rodada, grupo } = await request.json()
  
  if (id) {
    await sql`
      UPDATE jogos 
      SET time_casa = ${time_casa}, time_fora = ${time_fora}, 
          data_hora = ${data_hora}, rodada = ${rodada}, grupo = ${grupo} 
      WHERE id = ${id}
    `
  } else {
    await sql`
      INSERT INTO jogos (time_casa, time_fora, data_hora, rodada, grupo) 
      VALUES (${time_casa}, ${time_fora}, ${data_hora}, ${rodada}, ${grupo})
    `
  }
  
  return NextResponse.json({ success: true })
}