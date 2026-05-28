import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const databaseUrl = process.env.DATABASE_URL
const sql = neon(databaseUrl || '')

// GET - Buscar todos os jogos ordenados por rodada e data
export async function GET() {
  try {
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
  } catch (error) {
    console.error('Erro ao buscar jogos:', error)
    return NextResponse.json({ error: 'Erro ao buscar jogos' }, { status: 500 })
  }
}

// POST - Processar resultado de um jogo (com vitória ou empate)
export async function POST(request: Request) {
  try {
    const { jogoId, vencedor, rodada } = await request.json()

    if (vencedor === 'EMPATE') {
      // Em caso de empate: jogo finalizado sem vencedor
      await sql`
        UPDATE jogos 
        SET finalizado = true, vencedor_id = NULL
        WHERE id = ${jogoId}
      `

      // Após processar o resultado, atualizar a próxima fase (se for mata-mata)
if (rodada >= 4 && rodada <= 7) {
  await fetch(`${process.env.NEXTAUTH_URL}/api/admin/atualizar-proxima-fase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jogoId, vencedor, rodadaAtual: rodada })
  }).catch(console.error)
}
      
      // Buscar todos os palpites desta rodada
      const todosPalpites = await sql`
        SELECT p.usuario_id FROM palpites p
        WHERE p.rodada = ${rodada}
      `
      
      // Eliminar todos que palpitaram nesta rodada (pois empatou)
      for (const p of todosPalpites) {
        await sql`
          UPDATE usuarios 
          SET status = 'eliminado', rodada_eliminacao = ${rodada} 
          WHERE id = ${p.usuario_id} AND status = 'ativo'
        `
      }
      
      return NextResponse.json({ eliminados: todosPalpites.length })
    } else {
      // Vitória de um time
      await sql`
        UPDATE jogos 
        SET vencedor_id = (SELECT id FROM times WHERE nome = ${vencedor}), finalizado = true 
        WHERE id = ${jogoId}
      `

      // Buscar palpites que erraram (escolheram o time perdedor)
      const palpitesErrados = await sql`
        SELECT p.usuario_id FROM palpites p
        WHERE p.rodada = ${rodada} 
        AND p.time_id != (SELECT id FROM times WHERE nome = ${vencedor})
      `

      // Eliminar quem errou
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
    return NextResponse.json({ error: 'Erro ao processar resultado' }, { status: 500 })
  }
}

// PUT - Criar ou editar um jogo
export async function PUT(request: Request) {
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
    console.error('Erro ao salvar jogo:', error)
    return NextResponse.json({ error: 'Erro ao salvar jogo' }, { status: 500 })
  }
}