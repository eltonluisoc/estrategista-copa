import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { usuarioId, nome, email } = body

        console.log("🔧 Recebido:", { usuarioId, nome, email })

        // Resposta de teste - sem InfinitePay por enquanto
        return NextResponse.json({ 
            success: true, 
            message: "API funcionando!",
            link: "https://checkout.infinitepay.io/eltonluisoc/teste"
        })
    } catch (error) {
        console.error("❌ Erro:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}