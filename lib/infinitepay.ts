// lib/infinitepay.ts - VERSÃO MOCK PARA TESTE
export async function createPaymentLink(
    orderNsu: string,
    customer: { name: string; email: string; phone_number?: string },
    value: number = 20
) {
    console.log("🔧 MOCK: Criando link para:", { orderNsu, customer, value });
    
    // Retorna um link mockado
    return {
        success: true,
        link: `https://checkout.infinitepay.io/eltonluisoc/mock-${Date.now()}`,
        order_nsu: orderNsu,
        slug: `mock-${Date.now()}`
    };
}