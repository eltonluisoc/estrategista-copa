import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const jogos = await sql`
    SELECT * FROM jogos 
    ORDER BY 
      CASE 
        WHEN rodada = 1 THEN 1
        WHEN rodada = 2 THEN 2
        WHEN rodada = 3 THEN 3
        WHEN rodada = 4 THEN 4
        WHEN rodada = 5 THEN 5
        WHEN rodada = 6 THEN 6
        WHEN rodada = 7 THEN 7
        WHEN rodada = 8 THEN 8
      END,
      data_hora
  `
  return NextResponse.json(jogos)
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { jogoId, gols_casa, gols_fora, rodada } = await request.json()

    // Determinar vencedor baseado no placar
    let vencedor = null
    if (gols_casa > gols_fora) {
      // Buscar nome do time casa
      const timeCasa = await sql`
        SELECT time_casa FROM jogos WHERE id = ${jogoId}
      `
      vencedor = timeCasa[0]?.time_casa
    } else if (gols_fora > gols_casa) {
      const timeFora = await sql`
        SELECT time_fora FROM jogos WHERE id = ${jogoId}
      `
      vencedor = timeFora[0]?.time_fora
    } else {
      vencedor = 'EMPATE'
    }

    // Atualizar jogo com placar
    await sql`
      UPDATE jogos 
      SET gols_casa = ${gols_casa}, gols_fora = ${gols_fora}, 
          vencedor_id = (SELECT id FROM times WHERE nome = ${vencedor === 'EMPATE' ? 'EMPATE' : vencedor}),
          finalizado = true 
      WHERE id = ${jogoId}
    `

    // Processar eliminação
    if (vencedor === 'EMPATE') {
      const todosPalpites = await sql`
        SELECT p.usuario_id FROM palpites p
        WHERE p.rodada = ${rodada}
      `
      for (const p of todosPalpites) {
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodada} 
          WHERE id = ${p.usuario_id} AND status = 'ativo'
        `
      }
      return NextResponse.json({ eliminados: todosPalpites.length })
    } else {
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

  } catch (error) {
    console.error('Erro ao processar resultado:', error)
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
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
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}