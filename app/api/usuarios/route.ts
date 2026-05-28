import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

// GET - Buscar todos os usuários
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const excluirAdmin = searchParams.get('excluirAdmin') === 'true'
  
  let query = `
    SELECT id, nome, email, status, rodada_eliminacao 
    FROM usuarios 
    ORDER BY nome
  `
  
  if (excluirAdmin) {
    query = `
      SELECT id, nome, email, status, rodada_eliminacao 
      FROM usuarios 
      WHERE email != 'admin@estrategista.com'
      ORDER BY nome
    `
  }
  
  const usuarios = await sql(query)
  return NextResponse.json(usuarios)
}

// POST - Criar novo usuário
export async function POST(request: Request) {
  try {
    const { nome, email, senha } = await request.json()

    // Validar dados
    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres' }, { status: 400 })
    }

    // Verificar se email já existe
    const existente = await sql`
      SELECT * FROM usuarios WHERE email = ${email}
    `

    if (existente.length > 0) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 })
    }

    // Criar usuário
    const novoUsuario = await sql`
      INSERT INTO usuarios (id, email, nome, senha, status)
      VALUES (gen_random_uuid(), ${email}, ${nome}, ${senha}, 'ativo')
      RETURNING id, email, nome, status
    `

    return NextResponse.json(novoUsuario[0], { status: 201 })
  } catch (error) {
    console.error('Erro no cadastro:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}