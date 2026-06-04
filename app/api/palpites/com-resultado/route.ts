import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')

  if (!usuarioId) {
    return NextResponse.json({ error: 'usuarioId é obrigatório' }, { status: 400 })
  }

  const palpites = await sql`
    SELECT 
      p.id,
      p.rodada,
      p.time_id,
      t.nome as time_nome,
      j.finalizado,
      j.vencedor_id,
      CASE 
        WHEN j.finalizado = true AND j.vencedor_id = p.time_id THEN 'Acertou'
        WHEN j.finalizado = true AND j.vencedor_id != p.time_id THEN 'Errou'
        WHEN j.finalizado = false OR j.finalizado IS NULL THEN 'Aguardando'
        ELSE 'Aguardando'
      END as resultado
    FROM palpites p
    JOIN times t ON p.time_id = t.id
    LEFT JOIN jogos j ON j.rodada = p.rodada 
      AND (j.time_casa = t.nome OR j.time_fora = t.nome)
    WHERE p.usuario_id = ${usuarioId}
    ORDER BY p.rodada ASC
  `

  return NextResponse.json(palpites)
}