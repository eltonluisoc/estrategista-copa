import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'
import { createPaymentLink } from '@/lib/infinitepay'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
    try {
        const { usuarioId, nome, email } = await request.json()

        console.log("🔧 Criando pagamento para:", { usuarioId, nome, email })

        // order_nsu único
        const orderNsu = `estrategista_${usuarioId}_${Date.now()}`

        // Criar link no InfinitePay
        const result = await createPaymentLink(orderNsu, { name: nome, email }, 20)

        if (!result.success) {
            console.error("❌ Erro ao criar link:", result.error)
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        // Salvar no banco
        await sql`
            INSERT INTO pagamentos (usuario_id, transaction_id, status, link_pagamento, valor)
            VALUES (${usuarioId}, ${orderNsu}, 'pendente', ${result.link}, 20)
        `

        console.log("✅ Link criado com sucesso:", result.link)

        return NextResponse.json({
            success: true,
            link: result.link,
            orderNsu: orderNsu
        })
    } catch (error) {
        console.error("❌ Erro:", error)
        return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
    }
}