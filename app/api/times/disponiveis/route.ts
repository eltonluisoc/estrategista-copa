import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const rodada = parseInt(searchParams.get('rodada') || '1')
  const usuarioId = searchParams.get('usuarioId')

  if (!usuarioId) {
    return NextResponse.json({ error: 'usuarioId é obrigatório' }, { status: 400 })
  }

  // 1. Buscar times já usados pelo usuário
  const timesUsados = await sql`
    SELECT DISTINCT p.time_id
    FROM palpites p
    WHERE p.usuario_id = ${usuarioId}
  `
  const timesUsadosIds = timesUsados.map(t => t.time_id)

  // 2. Buscar times que participam da rodada atual (baseado nos jogos)
  const timesDaRodada = await sql`
    SELECT DISTINCT t.id, t.nome, t.grupo
    FROM times t
    WHERE t.nome IN (
      SELECT time_casa FROM jogos WHERE rodada = ${rodada}
      UNION
      SELECT time_fora FROM jogos WHERE rodada = ${rodada}
    )
  `

  // 3. Filtrar: times da rodada que NÃO foram usados
  const timesDisponiveis = timesDaRodada.filter(t => !timesUsadosIds.includes(t.id))

  return NextResponse.json(timesDisponiveis)
}