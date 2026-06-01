"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2 } from "lucide-react";

function ConfirmacaoContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("verificando");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const orderNsu = searchParams.get("order_nsu");
        const transactionNsu = searchParams.get("transaction_nsu");
        const slug = searchParams.get("slug");
        const captureMethod = searchParams.get("capture_method");

        console.log("Parâmetros recebidos:", { orderNsu, transactionNsu, slug, captureMethod });

        if (orderNsu) {
            setStatus("sucesso");
            setTimeout(() => router.push("/login"), 3000);
        } else {
            setStatus("pendente");
            setTimeout(() => router.push("/login"), 5000);
        }
    }, [searchParams, router, isClient]);

    if (!isClient) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
                <div className="bg-white/10 rounded-2xl p-8 text-center">
                    <Loader2 className="w-16 h-16 text-yellow-500 mx-auto animate-spin mb-4" />
                    <p className="text-white">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
            <div className="bg-white/10 rounded-2xl p-8 max-w-md text-center border border-yellow-500/30">
                {status === "verificando" && (
                    <>
                        <Loader2 className="w-16 h-16 text-yellow-500 mx-auto animate-spin mb-4" />
                        <h2 className="text-xl font-bold text-white">Verificando pagamento...</h2>
                        <p className="text-gray-400 mt-2">Aguarde um momento</p>
                    </>
                )}
                {status === "sucesso" && (
                    <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white">Pagamento Confirmado!</h2>
                        <p className="text-green-400 mt-2">Sua conta foi aprovada.</p>
                        <p className="text-gray-400 text-sm mt-4">Redirecionando para o login...</p>
                    </>
                )}
                {status === "pendente" && (
                    <>
                        <h2 className="text-xl font-bold text-white">Aguardando confirmação</h2>
                        <p className="text-yellow-400 mt-2">Seu pagamento está sendo processado.</p>
                        <Link href="/login" className="text-yellow-500 underline mt-4 inline-block">
                            Ir para o login →
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ConfirmacaoPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-green-950 to-black flex items-center justify-center">
                <div className="bg-white/10 rounded-2xl p-8 text-center">
                    <Loader2 className="w-16 h-16 text-yellow-500 mx-auto animate-spin mb-4" />
                    <p className="text-white">Carregando...</p>
                </div>
            </div>
        }>
            <ConfirmacaoContent />
        </Suspense>
    );
}
