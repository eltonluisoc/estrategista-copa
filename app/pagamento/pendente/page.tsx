"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlobalHeader } from "@/components/GlobalHeader";

export default function PagamentoPendentePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    const gerarPagamento = async () => {
        setLoading(true);
        setMensagem("");

        try {
            const res = await fetch("/api/pagamento/criar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuarioId: session?.user?.id,
                    nome: session?.user?.name,
                    email: session?.user?.email
                })
            });

            const data = await res.json();

            if (res.ok && data.link) {
                window.location.href = data.link;
            } else {
                setMensagem(data.error || "Erro ao gerar pagamento");
            }
        } catch (error) {
            setMensagem("Erro de conexão");
        }
        setLoading(false);
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
                <GlobalHeader />
                <div className="flex items-center justify-center py-20">
                    <div className="text-yellow-500">Carregando...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-950 to-black">
            <GlobalHeader />
            <div className="container mx-auto px-4 py-20 max-w-md">
                <div className="bg-white/10 rounded-2xl p-8 text-center border border-yellow-500/30">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        Pagamento Pendente
                    </h2>
                    <p className="text-gray-400 mb-6">
                        Você ainda não concluiu o pagamento da sua inscrição.
                        <br />
                        <span className="text-yellow-500 font-semibold">R$ 20,00</span>
                    </p>

                    {mensagem && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
                            {mensagem}
                        </div>
                    )}

                    <button
                        onClick={gerarPagamento}
                        disabled={loading}
                        className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                    >
                        {loading ? "Gerando link..." : "💳 Pagar Agora"}
                    </button>

                    <p className="text-gray-500 text-xs mt-4">
                        Após o pagamento, sua conta será aprovada automaticamente.
                    </p>
                </div>
            </div>
        </div>
    );
}