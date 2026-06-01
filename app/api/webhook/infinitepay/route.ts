import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { order_nsu, paid, amount, capture_method, receipt_url } = body;

        console.log("📦 Webhook recebido:", { order_nsu, paid, capture_method });

        if (paid === true && order_nsu) {
            // Buscar pagamento
            const pagamento = await sql`
                SELECT usuario_id FROM pagamentos 
                WHERE transaction_id = ${order_nsu}
            `;

            if (pagamento.length > 0) {
                // Atualizar status
                await sql`
                    UPDATE pagamentos 
                    SET status = "pago", 
                        paid_at = NOW(), 
                        receipt_url = ${receipt_url || ""}
                    WHERE transaction_id = ${order_nsu}
                `;

                // Aprovar usuário
                await sql`
                    UPDATE usuarios 
                    SET aprovado = true, pagamento_confirmado = true
                    WHERE id = ${pagamento[0].usuario_id}
                `;

                console.log(`✅ Usuário ${pagamento[0].usuario_id} aprovado!`);
            }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Erro webhook:", error);
        return NextResponse.json({ success: false, message: "Erro" }, { status: 400 });
    }
}
