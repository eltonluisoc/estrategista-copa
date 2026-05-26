import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

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

export async function POST(request: Request) {
  try {
    const { usuarioId, timeId, rodada } = await request.json()

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