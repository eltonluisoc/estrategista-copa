import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

// CORREÇÃO DEFINITIVA - Prazo sempre 23:59 do dia anterior
function calcularPrazoBrasilia(dataHora: Date): Date {
    // Criar uma nova data com o dia anterior
    const prazo = new Date(dataHora);
    prazo.setDate(dataHora.getDate() - 1);
    // Forçar 23:59:00
    prazo.setHours(23, 59, 0, 0);
    return prazo;
}

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const jogos = await sql`
    SELECT * FROM jogos 
    ORDER BY rodada, data_hora
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
      SELECT id, time_casa, time_fora FROM jogos WHERE id = ${jogoId}
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

    // Buscar APENAS os palpites deste jogo específico
    const palpitesDesteJogo = await sql`
      SELECT p.usuario_id, p.time_id, t.nome as time_escolhido
      FROM palpites p
      JOIN times t ON p.time_id = t.id
      WHERE p.rodada = ${rodada}
        AND (t.nome = ${jogo[0].time_casa} OR t.nome = ${jogo[0].time_fora})
    `

    let eliminados = 0
    const eliminadosIds = []

    if (vencedor === 'EMPATE') {
      for (const p of palpitesDesteJogo) {
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodada} 
          WHERE id = ${p.usuario_id} AND status = 'ativo'
        `
        eliminados++
        eliminadosIds.push(p.usuario_id)
      }
    } else {
      for (const p of palpitesDesteJogo) {
        if (p.time_escolhido !== vencedor) {
          await sql`
            UPDATE usuarios 
            SET status = 'eliminado', rodada_eliminacao = ${rodada} 
            WHERE id = ${p.usuario_id} AND status = 'ativo'
          `
          eliminados++
          eliminadosIds.push(p.usuario_id)
        }
      }
    }

    // ============================================================
    // CORREÇÃO: Eliminar participantes ativos que NÃO palpitaram nesta rodada
    // ============================================================
    const participantesSemPalpite = await sql`
      SELECT u.id
      FROM usuarios u
      WHERE u.status = 'ativo'
        AND u.email != 'admin@estrategista.com'
        AND NOT EXISTS (
          SELECT 1 FROM palpites p 
          WHERE p.usuario_id = u.id AND p.rodada = ${rodada}
        )
    `

    for (const p of participantesSemPalpite) {
      await sql`
        UPDATE usuarios 
        SET status = 'eliminado', rodada_eliminacao = ${rodada} 
        WHERE id = ${p.id}
      `
      eliminados++
      eliminadosIds.push(p.id)
    }
    // ============================================================

    // Registrar log de eliminação
    if (eliminadosIds.length > 0) {
      await sql`
        INSERT INTO eliminacoes_log (jogo_id, rodada, vencedor, eliminados_ids, created_at)
        VALUES (${jogoId}, ${rodada}, ${vencedor}, ${eliminadosIds.join(',')}, NOW())
      `
    }

    // Retornar os jogos atualizados
    const jogosAtualizados = await sql`
      SELECT * FROM jogos 
      ORDER BY rodada, data_hora
    `

    return NextResponse.json({ 
      eliminados,
      message: `${eliminados} participante(s) eliminado(s)`,
      vencedor,
      jogos: jogosAtualizados
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

    // CORREÇÃO DEFINITIVA DO PRAZO
    const dataHoraObj = new Date(data_hora)
    const prazo = new Date(dataHoraObj)
    prazo.setDate(dataHoraObj.getDate() - 1)
    prazo.setHours(23, 59, 0, 0)

    if (id) {
      await sql`
        UPDATE jogos 
        SET time_casa = ${time_casa}, 
            time_fora = ${time_fora}, 
            data_hora = ${data_hora}, 
            prazo = ${prazo.toISOString()},
            rodada = ${rodada}, 
            grupo = ${grupo} 
        WHERE id = ${id}
      `
    } else {
      await sql`
        INSERT INTO jogos (time_casa, time_fora, data_hora, prazo, rodada, grupo) 
        VALUES (${time_casa}, ${time_fora}, ${data_hora}, ${prazo.toISOString()}, ${rodada}, ${grupo})
      `
    }

    const jogosAtualizados = await sql`
      SELECT * FROM jogos 
      ORDER BY rodada, data_hora
    `

    return NextResponse.json({ success: true, jogos: jogosAtualizados })
  } catch (error) {
    console.error('Erro ao salvar jogo:', error)
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (session?.user?.email !== 'admin@estrategista.com') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const id = url.pathname.split('/').pop()
    
    await sql`
      DELETE FROM jogos WHERE id = ${id}
    `
    
    const jogosAtualizados = await sql`
      SELECT * FROM jogos 
      ORDER BY rodada, data_hora
    `
    
    return NextResponse.json({ success: true, jogos: jogosAtualizados })
  } catch (error) {
    console.error('Erro ao deletar jogo:', error)
    return NextResponse.json({ error: 'Erro ao deletar' }, { status: 500 })
  }
}