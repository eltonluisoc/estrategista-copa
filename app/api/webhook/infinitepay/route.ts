import { neon } from '@neondatabase/serverless'
import { NextResponse } from 'next/server'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { order_nsu, capture_method } = body

        console.log("📦 Webhook recebido:", { order_nsu, capture_method })

        if (capture_method === "pix" && order_nsu) {
            // Buscar o pagamento
            const pagamento = await sql`
                SELECT id, usuario_id FROM pagamentos 
                WHERE transaction_id = ${order_nsu}
            `

            console.log("🔍 Pagamento encontrado:", pagamento)

            if (pagamento && pagamento.length > 0) {
                // Atualizar pagamento
                await sql`
                    UPDATE pagamentos 
                    SET status = 'pago', paid_at = NOW()
                    WHERE transaction_id = ${order_nsu}
                `

                // Atualizar usuário
                const result = await sql`
                    UPDATE usuarios 
                    SET aprovado = true, pagamento_confirmado = true
                    WHERE id = ${pagamento[0].usuario_id}
                    RETURNING id, email, aprovado
                `

                console.log("✅ Usuário atualizado:", result)
                return NextResponse.json({ success: true, usuario: result[0] }, { status: 200 })
            } else {
                console.log("❌ Pagamento NÃO encontrado para:", order_nsu)
            }
        }

        return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
        console.error("❌ Erro webhook:", error)
        return NextResponse.json({ success: false, error: String(error) }, { status: 200 })
    }
}