import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const databaseUrl = process.env.DATABASE_URL
const sql = neon(databaseUrl || '')

// GET - Buscar todos os jogos
export async function GET() {
  try {
    const jogos = await sql`
      SELECT 
        id, 
        time_casa, 
        time_fora, 
        data_hora, 
        grupo, 
        finalizado, 
        rodada, 
        prazo, 
        vencedor_id, 
        gols_casa, 
        gols_fora,
        to_char(prazo, 'YYYY-MM-DD HH24:MI:SS') as prazo_sem_tz
      FROM jogos 
      ORDER BY data_hora
    `
    
    // Formatar a resposta para remover o 'Z' do prazo
    const jogosFormatados = jogos.map(jogo => ({
      ...jogo,
      prazo: jogo.prazo_sem_tz || jogo.prazo,
      prazo_sem_tz: undefined
    }))
    
    return NextResponse.json(jogosFormatados)
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
      await sql`
        UPDATE jogos 
        SET finalizado = true, vencedor_id = NULL
        WHERE id = ${jogoId}
      `
      
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