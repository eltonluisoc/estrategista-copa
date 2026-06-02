const INFINITEPAY_API = "https://api.checkout.infinitepay.io";

export async function createPaymentLink(
    orderNsu: string,
    customer: { name: string; email: string; phone_number?: string },
    value: number = 20
) {
    const amountInCents = value * 100;
    
    // Payload EXATAMENTE como a documentação (usando "itens")
    const payload = {
        handle: "eltonluisoc",
        order_nsu: orderNsu,
        itens: [  // ← ATENÇÃO: "itens" com S, igual à documentação!
            {
                quantity: 1,
                price: amountInCents,
                description: "Inscrição Estrategista da Copa 2026"
            }
        ],
        customer: {
            name: customer.name,
            email: customer.email,
            phone_number: customer.phone_number || "(11) 99999-9999"
        },
        redirect_url: "https://estrategista-copa.vercel.app/pagamento/confirmacao",
        webhook_url: "https://estrategista-copa.vercel.app/api/webhook/infinitepay"
    };

    console.log("📤 Payload enviado:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${INFINITEPAY_API}/links`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("📥 Resposta InfinitePay:", data);

    if (!response.ok) {
        return { 
            success: false, 
            error: data.message || data.error || "Erro ao criar link" 
        };
    }

    if (!data.url) {
        return { 
            success: false, 
            error: "Resposta sem URL" 
        };
    }

    return {
        success: true,
        link: data.url,
        order_nsu: data.order_nsu,
        slug: data.slug
    };
}