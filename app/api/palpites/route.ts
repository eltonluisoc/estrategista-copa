import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

// GET - Buscar palpites do usuário
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')

  if (!usuarioId) {
    return NextResponse.json({ error: 'usuarioId é obrigatório' }, { status: 400 })
  }

  try {
    const palpites = await sql`
      SELECT * FROM palpites WHERE usuario_id = ${usuarioId} ORDER BY rodada
    `
    return NextResponse.json(palpites)
  } catch (error) {
    console.error('Erro ao buscar palpites:', error)
    return NextResponse.json({ error: 'Erro ao buscar palpites' }, { status: 500 })
  }
}

// POST - Registrar novo palpite
export async function POST(request: Request) {
  try {
    const { usuarioId, timeId, rodada } = await request.json()

    // Verificar se o usuário está ativo e aprovado
    const usuario = await sql`
      SELECT status, aprovado FROM usuarios WHERE id = ${usuarioId}
    `
    if (usuario.length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }
    if (!usuario[0].aprovado) {
      return NextResponse.json({ error: 'Aguardando aprovação do administrador' }, { status: 403 })
    }
    if (usuario[0].status === 'eliminado') {
      return NextResponse.json({ error: 'Você já foi eliminado' }, { status: 403 })
    }

    // Verificar se já existe palpite nesta rodada
    const existente = await sql`
      SELECT * FROM palpites WHERE usuario_id = ${usuarioId} AND rodada = ${rodada}
    `
    if (existente.length > 0) {
      return NextResponse.json({ error: 'Você já fez um palpite para esta rodada!' }, { status: 400 })
    }

    // Verificar se o time já foi usado
    const timeUsado = await sql`
      SELECT * FROM palpites WHERE usuario_id = ${usuarioId} AND time_id = ${timeId}
    `
    if (timeUsado.length > 0) {
      return NextResponse.json({ error: 'Você já usou este time em uma rodada anterior!' }, { status: 400 })
    }

    // Verificar se o time realmente joga nesta rodada
    const jogo = await sql`
      SELECT * FROM jogos 
      WHERE rodada = ${rodada} 
      AND (time_casa = (SELECT nome FROM times WHERE id = ${timeId}) 
           OR time_fora = (SELECT nome FROM times WHERE id = ${timeId}))
      AND finalizado = false
    `
    if (jogo.length === 0) {
      return NextResponse.json({ error: 'Este time não joga nesta rodada ou o jogo já foi finalizado!' }, { status: 400 })
    }

    // Registrar palpite
    const novoPalpite = await sql`
      INSERT INTO palpites (usuario_id, time_id, rodada)
      VALUES (${usuarioId}, ${timeId}, ${rodada})
      RETURNING *
    `

    return NextResponse.json(novoPalpite[0], { status: 201 })

  } catch (error) {
    console.error('Erro ao registrar palpite:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE - Remover palpite (para edição)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const palpiteId = searchParams.get('id')

    if (!palpiteId) {
      return NextResponse.json({ error: 'ID do palpite é obrigatório' }, { status: 400 })
    }

    // Verificar prazo
    const palpite = await sql`
      SELECT p.*, j.prazo, j.rodada
      FROM palpites p
      JOIN jogos j ON j.rodada = p.rodada
      WHERE p.id = ${palpiteId}
    `

    if (palpite.length === 0) {
      return NextResponse.json({ error: 'Palpite não encontrado' }, { status: 404 })
    }

    const prazo = new Date(palpite[0].prazo)
    const agora = new Date()

    if (agora > prazo) {
      return NextResponse.json({ error: 'Prazo para alterar este palpite já encerrado' }, { status: 400 })
    }

    await sql`DELETE FROM palpites WHERE id = ${palpiteId}`
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Erro ao deletar palpite:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}