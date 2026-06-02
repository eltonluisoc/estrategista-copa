// lib/infinitepay.ts - VERSÃO CORRIGIDA COM TIPAGEM
const INFINITEPAY_API = "https://api.checkout.infinitepay.io";

interface InfinitePayPayload {
    handle: string | undefined;
    redirect_url: string;
    webhook_url: string;
    order_nsu: string;
    items: Array<{
        quantity: number;
        price: number;
        description: string;
    }>;
    customer?: {
        name: string;
        email: string;
        phone_number: string;
    };
}

export async function createPaymentLink(
    orderNsu: string,
    customer: { name: string; email: string; phone_number?: string },
    value: number = 20
) {
    // Valor em centavos (R$ 20,00 = 2000 centavos)
    const amountInCents = value * 100;
    
    const payload: InfinitePayPayload = {
        handle: process.env.INFINITEPAY_HANDLE,
        redirect_url: `${process.env.NEXTAUTH_URL}/pagamento/confirmacao`,
        webhook_url: `${process.env.NEXTAUTH_URL}/api/webhook/infinitepay`,
        order_nsu: orderNsu,
        items: [
            {
                quantity: 1,
                price: amountInCents,
                description: "Inscrição Estrategista da Copa 2026"
            }
        ]
    };

    // Adicionar dados do cliente se disponíveis
    if (customer.name && customer.email) {
        payload.customer = {
            name: customer.name,
            email: customer.email,
            phone_number: customer.phone_number || ""
        };
    }

    try {
        console.log("🔧 Enviando para InfinitePay:", JSON.stringify(payload, null, 2));
        
        const response = await fetch(`${INFINITEPAY_API}/links`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log("✅ Resposta InfinitePay:", data);

        if (response.ok && data.url) {
            return {
                success: true,
                link: data.url,
                order_nsu: data.order_nsu,
                slug: data.slug
            };
        } else {
            console.error("❌ Erro detalhado:", data);
            return { 
                success: false, 
                error: data.message || data.error || "Erro ao criar link" 
            };
        }
    } catch (error) {
        console.error("❌ Erro de conexão:", error);
        return { success: false, error: "Erro de conexão com InfinitePay" };
    }
}