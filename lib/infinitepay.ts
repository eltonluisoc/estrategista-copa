// lib/infinitepay.ts
const INFINITEPAY_API = 'https://api.checkout.infinitepay.io';
@"
// lib/infinitepay.ts
const INFINITEPAY_API = 'https://api.checkout.infinitepay.io';

export async function createPaymentLink(
    orderNsu: string,
    customer: { name: string; email: string; phone_number?: string },
    value: number = 20
) {
    const amountInCents = value * 100;
    
    const payload = {
        handle: process.env.INFINITEPAY_HANDLE,
        order_nsu: orderNsu,
        itens: [
            {
                quantity: 1,
                price: amountInCents,
                description: 'Inscrição Estrategista da Copa 2026'
            }
        ],
        customer: {
            name: customer.name,
            email: customer.email,
            phone_number: customer.phone_number || ''
        },
        redirect_url: ${process.env.NEXTAUTH_URL}/pagamento/confirmacao,
        webhook_url: ${process.env.NEXTAUTH_URL}/api/webhook/infinitepay
    };

    try {
        const response = await fetch(${INFINITEPAY_API}/links, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Resposta InfinitePay:', data);

        if (response.ok && data.url) {
            return {
                success: true,
                link: data.url,
                order_nsu: data.order_nsu,
                slug: data.slug
            };
        } else {
            return { success: false, error: data.error || 'Erro ao criar link' };
        }
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, error: 'Erro de conexão' };
    }
}

export async function checkPaymentStatus(orderNsu: string) {
    try {
        const response = await fetch(${INFINITEPAY_API}/payment_check, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                handle: process.env.INFINITEPAY_HANDLE,
                order_nsu: orderNsu
            })
        });

        return await response.json();
    } catch (error) {
        console.error('Erro:', error);
        return { success: false, paid: false };
    }
}
