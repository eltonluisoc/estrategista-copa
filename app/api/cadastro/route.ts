import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
    try {
        const { nome, email, senha } = await request.json()

        if (!nome || !email || !senha) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 })
        }

        if (senha.length < 6) {
            return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 })
        }

        // Verificar se usuário já existe
        const usuarioExistente = await sql`
            SELECT id FROM usuarios WHERE email = ${email}
        `

        if (usuarioExistente.length > 0) {
            return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 400 })
        }

        // Criar usuário (sem hash por enquanto - simplificado para teste)
        const result = await sql`
            INSERT INTO usuarios (nome, email, senha, status, aprovado, pagamento_confirmado)
            VALUES (${nome}, ${email}, ${senha}, 'ativo', false, false)
            RETURNING id, nome, email
        `

        const usuario = result[0]

        return NextResponse.json({
            success: true,
            usuarioId: usuario.id,
            nome: usuario.nome,
            email: usuario.email
        })

    } catch (error) {
        console.error('Erro no cadastro:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}