import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const sql = neon(process.env.DATABASE_URL!)

// Buscar modo teste
async function getModoTeste() {
  const config = await sql`
    SELECT valor FROM configuracoes WHERE chave = 'modo_teste'
  `
  return config.length > 0 ? config[0].valor === 'true' : true
}

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
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { timeId, rodada } = await request.json()
    const usuarioId = session.user.id
    const modoTeste = await getModoTeste()

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

    // Verificar prazo (apenas se NÃO estiver em modo teste)
    if (!modoTeste) {
      const timeNome = await sql`SELECT nome FROM times WHERE id = ${timeId}`
      const jogo = await sql`
        SELECT prazo FROM jogos 
        WHERE rodada = ${rodada} 
        AND (time_casa = ${timeNome[0]?.nome} OR time_fora = ${timeNome[0]?.nome})
      `
      
      if (jogo.length > 0 && jogo[0].prazo) {
        const prazo = new Date(jogo[0].prazo)
        const agora = new Date()
        if (agora > prazo) {
          return NextResponse.json({ error: 'Prazo para palpitar este jogo já encerrado!' }, { status: 400 })
        }
      }
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

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const palpiteId = searchParams.get('id')

    if (!palpiteId) {
      return NextResponse.json({ error: 'ID do palpite é obrigatório' }, { status: 400 })
    }

    const palpite = await sql`
      SELECT p.*, j.prazo, j.rodada
      FROM palpites p
      JOIN jogos j ON j.rodada = p.rodada
      WHERE p.id = ${palpiteId} AND p.usuario_id = ${session.user.id}
    `

    if (palpite.length === 0) {
      return NextResponse.json({ error: 'Palpite não encontrado' }, { status: 404 })
    }

    const modoTeste = await getModoTeste()
    
    if (!modoTeste) {
      const prazo = new Date(palpite[0].prazo)
      const agora = new Date()
      if (agora > prazo) {
        return NextResponse.json({ error: 'Prazo para alterar este palpite já encerrado' }, { status: 400 })
      }
    }

    await sql`DELETE FROM palpites WHERE id = ${palpiteId}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar palpite:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}