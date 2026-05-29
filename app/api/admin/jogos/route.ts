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

    // Buscar o jogo para saber os times
    const jogo = await sql`
      SELECT time_casa, time_fora FROM jogos WHERE id = ${jogoId}
    `
    if (jogo.length === 0) {
      return NextResponse.json({ error: 'Jogo não encontrado' }, { status: 404 })
    }

    // Determinar vencedor baseado no placar
    let vencedor = null
    if (gols_casa > gols_fora) {
      vencedor = jogo[0].time_casa
    } else if (gols_fora > gols_casa) {
      vencedor = jogo[0].time_fora
    } else {
      vencedor = 'EMPATE'
    }

    // Atualizar jogo com placar
    await sql`
      UPDATE jogos 
      SET gols_casa = ${gols_casa}, gols_fora = ${gols_fora}, 
          vencedor_id = ${vencedor === 'EMPATE' ? null : (await sql`SELECT id FROM times WHERE nome = ${vencedor}`)[0]?.id},
          finalizado = true 
      WHERE id = ${jogoId}
    `

    // Buscar todos os palpites da rodada
    const todosPalpites = await sql`
      SELECT p.usuario_id, p.time_id, t.nome as time_nome
      FROM palpites p
      JOIN times t ON p.time_id = t.id
      WHERE p.rodada = ${rodada}
    `

    let eliminados = 0
    let eliminadosLista = []

    if (vencedor === 'EMPATE') {
      // Em caso de empate, TODOS são eliminados
      for (const p of todosPalpites) {
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodada} 
          WHERE id = ${p.usuario_id} AND status = 'ativo'
        `
        eliminados++
        eliminadosLista.push(p.usuario_id)
      }
    } else {
      // Vitória: elimina quem NÃO apostou no vencedor
      for (const p of todosPalpites) {
        const timeApostado = p.time_nome
        if (timeApostado !== vencedor) {
          await sql`
            UPDATE usuarios 
            SET status = 'eliminado', rodada_eliminacao = ${rodada} 
            WHERE id = ${p.usuario_id} AND status = 'ativo'
          `
          eliminados++
          eliminadosLista.push(p.usuario_id)
        }
      }
    }

    // Registrar log de eliminação
    if (eliminadosLista.length > 0) {
      await sql`
        INSERT INTO eliminacoes_log (jogo_id, rodada, vencedor, eliminados_ids, created_at)
        VALUES (${jogoId}, ${rodada}, ${vencedor}, ${eliminadosLista.join(',')}, NOW())
      `
    }

    return NextResponse.json({ 
      eliminados, 
      message: `${eliminados} participante(s) eliminado(s)`,
      vencedor 
    })

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