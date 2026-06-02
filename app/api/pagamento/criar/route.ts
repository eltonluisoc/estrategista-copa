import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { usuarioId, nome, email } = body

        console.log("🔧 Recebido:", { usuarioId, nome, email })

        // Versão simplificada - retorna link mockado
        return NextResponse.json({ 
            success: true, 
            message: "API funcionando!",
            link: "https://checkout.infinitepay.io/eltonluisoc/teste",
            orderNsu: `mock_${Date.now()}`
        })
    } catch (error) {
        console.error("❌ Erro:", error)
        return NextResponse.json({ error: "Erro interno" }, { status: 500 })
    }
}